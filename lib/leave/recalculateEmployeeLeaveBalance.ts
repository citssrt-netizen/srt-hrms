import { calculateProratedEntitlement } from "@/lib/leave/calculateProratedEntitlement";
import { resolveLeavePolicy } from "@/lib/leave/resolveLeavePolicy";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RecalculateEmployeeLeaveBalanceParams = {
  employeeId: number;
  leaveTypeId: number;
  year: number;
};

async function getLeaveUsageTotals(
  employeeId: number,
  leaveTypeId: number,
  year: number
) {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data, error } = await supabaseAdmin
    .from("hr_leave_requests")
    .select("total_days, status")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .gte("start_date", yearStart)
    .lte("start_date", yearEnd)
    .in("status", ["approved", "pending"]);

  if (error) {
    throw new Error("Failed to calculate leave usage.");
  }

  return (data || []).reduce(
    (totals, request) => {
      const totalDays = Number(request.total_days || 0);

      if (request.status === "approved") {
        totals.usedDays += totalDays;
      }

      if (request.status === "pending") {
        totals.pendingDays += totalDays;
      }

      return totals;
    },
    {
      usedDays: 0,
      pendingDays: 0,
    }
  );
}

export async function recalculateEmployeeLeaveBalance({
  employeeId,
  leaveTypeId,
  year,
}: RecalculateEmployeeLeaveBalanceParams) {
  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("hr_employees")
    .select("joined_date")
    .eq("id", employeeId)
    .single();

  if (employeeError || !employee) {
    throw new Error("Employee not found.");
  }

  const resolvedPolicy = await resolveLeavePolicy({
    employeeId,
    leaveTypeId,
    year,
  });

  const { data: existingBalance, error: balanceError } = await supabaseAdmin
    .from("hr_employee_leave_balances")
    .select("carried_forward_days")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", year)
    .maybeSingle();

  if (balanceError) {
    throw new Error("Failed to check employee leave balance.");
  }

  const entitlementDays = calculateProratedEntitlement({
    defaultEntitlementDays: resolvedPolicy.resolvedEntitlementDays,
    joinedDate: employee.joined_date,
    year,
    allowProration: resolvedPolicy.allowProration,
  });

  const carriedForwardDays = resolvedPolicy.allowCarryForward
    ? Number(existingBalance?.carried_forward_days || 0)
    : 0;

  const cappedCarriedForwardDays =
    resolvedPolicy.maxCarryForwardDays > 0
      ? Math.min(carriedForwardDays, resolvedPolicy.maxCarryForwardDays)
      : carriedForwardDays;

  const { usedDays, pendingDays } = await getLeaveUsageTotals(
    employeeId,
    leaveTypeId,
    year
  );

  const balanceDays = entitlementDays + cappedCarriedForwardDays - usedDays;

  const { data: updatedBalance, error: upsertError } = await supabaseAdmin
    .from("hr_employee_leave_balances")
    .upsert(
      {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
        entitlement_days: entitlementDays,
        carried_forward_days: cappedCarriedForwardDays,
        used_days: usedDays,
        pending_days: pendingDays,
        balance_days: balanceDays,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "employee_id,leave_type_id,year",
      }
    )
    .select("*")
    .single();

  if (upsertError) {
    throw new Error("Failed to recalculate employee leave balance.");
  }

  return updatedBalance;
}