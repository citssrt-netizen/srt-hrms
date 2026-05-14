import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getLeaveYear(startDate: string) {
  const date = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear();
  }

  return date.getFullYear();
}

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

async function syncEmployeeLeaveBalance(
  employeeId: number,
  leaveTypeId: number,
  year: number
) {
  const { data: leaveType, error: leaveTypeError } = await supabaseAdmin
    .from("hr_leave_types")
    .select("default_days")
    .eq("id", leaveTypeId)
    .single();

  if (leaveTypeError || !leaveType) {
    throw new Error("Leave type not found.");
  }

  const { data: existingBalance, error: balanceError } = await supabaseAdmin
    .from("hr_employee_leave_balances")
    .select("entitlement_days, carried_forward_days")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", year)
    .maybeSingle();

  if (balanceError) {
    throw new Error("Failed to check employee leave balance.");
  }

  const entitlementDays =
    existingBalance?.entitlement_days !== undefined &&
    existingBalance?.entitlement_days !== null
      ? Number(existingBalance.entitlement_days)
      : Number(leaveType.default_days || 0);

  const carriedForwardDays = Number(
    existingBalance?.carried_forward_days || 0
  );

  const { usedDays, pendingDays } = await getLeaveUsageTotals(
    employeeId,
    leaveTypeId,
    year
  );

  const balanceDays = entitlementDays + carriedForwardDays - usedDays;

  const { error: upsertError } = await supabaseAdmin
    .from("hr_employee_leave_balances")
    .upsert(
      {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
        entitlement_days: entitlementDays,
        carried_forward_days: carriedForwardDays,
        used_days: usedDays,
        pending_days: pendingDays,
        balance_days: balanceDays,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "employee_id,leave_type_id,year",
      }
    );

  if (upsertError) {
    throw new Error("Failed to sync employee leave balance.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireApiAuth(["employer"]);

  if (response) {
    return response;
  }

  const { id } = await context.params;

  const leaveRequestId = Number(id);

  if (!leaveRequestId) {
    return NextResponse.json(
      { error: "Invalid leave request ID." },
      { status: 400 }
    );
  }

  const body = await request.json();

  const status = String(body.status || "").trim();
  const employerRemark = String(body.employer_remark || "").trim();

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid leave status." },
      { status: 400 }
    );
  }

  const { data: existingRequest, error: existingError } = await supabaseAdmin
    .from("hr_leave_requests")
    .select("id, employee_id, leave_type_id, start_date, status")
    .eq("id", leaveRequestId)
    .single();

  if (existingError || !existingRequest) {
    return NextResponse.json(
      { error: "Leave request not found." },
      { status: 404 }
    );
  }

  if (existingRequest.status !== "pending") {
    return NextResponse.json(
      {
        error: "Only pending leave requests can be approved or rejected.",
      },
      { status: 400 }
    );
  }

  const { data: updatedLeaveRequest, error } = await supabaseAdmin
    .from("hr_leave_requests")
    .update({
      status,
      employer_remark: employerRemark || null,
      approved_at: new Date().toISOString(),
      approved_by: null,
    })
    .eq("id", leaveRequestId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update leave request." },
      { status: 500 }
    );
  }

  try {
    const leaveYear = getLeaveYear(existingRequest.start_date);

    await syncEmployeeLeaveBalance(
      Number(existingRequest.employee_id),
      Number(existingRequest.leave_type_id),
      leaveYear
    );

    await supabaseAdmin.from("hr_leave_audit_logs").insert({
      leave_request_id: leaveRequestId,
      employee_id: existingRequest.employee_id,
      action: status,
      old_status: "pending",
      new_status: status,
      remarks: employerRemark || null,
      performed_by_role: "employer",
      performed_by_employee_id: null,
    });
  } catch {
    return NextResponse.json(
      { error: "Leave was updated, but balance sync failed." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { leaveRequest: updatedLeaveRequest },
    { status: 200 }
  );
}