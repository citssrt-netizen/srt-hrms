import { calculateLeaveWorkingDays } from "@/lib/leave/calculateLeaveWorkingDays";
import { recalculateEmployeeLeaveBalance } from "@/lib/leave/recalculateEmployeeLeaveBalance";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getLeaveYear(startDate: string) {
  const date = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear();
  }

  return date.getFullYear();
}

type RecalculateLeaveRequestsForHolidayDateParams = {
  holidayDate: string;
  action: "public_holiday_created" | "public_holiday_deleted";
  holidayName?: string | null;
};

export async function recalculateLeaveRequestsForHolidayDate({
  holidayDate,
  action,
  holidayName,
}: RecalculateLeaveRequestsForHolidayDateParams) {
  const { data: affectedRequests, error } = await supabaseAdmin
    .from("hr_leave_requests")
    .select(
      "id, employee_id, leave_type_id, start_date, end_date, total_days, status, is_half_day"
    )
    .in("status", ["pending", "approved"])
    .lte("start_date", holidayDate)
    .gte("end_date", holidayDate);

  if (error) {
    throw new Error("Failed to load affected leave requests.");
  }

  const affectedBalanceKeys = new Map<
    string,
    {
      employeeId: number;
      leaveTypeId: number;
      year: number;
    }
  >();

  let recalculatedRequests = 0;

  for (const request of affectedRequests || []) {
    const oldTotalDays = Number(request.total_days || 0);

    const newTotalDays = await calculateLeaveWorkingDays({
      startDateValue: String(request.start_date),
      endDateValue: String(request.end_date),
      isHalfDay: Boolean(request.is_half_day),
    });

    const employeeId = Number(request.employee_id);
    const leaveTypeId = Number(request.leave_type_id);
    const year = getLeaveYear(String(request.start_date));

    affectedBalanceKeys.set(`${employeeId}-${leaveTypeId}-${year}`, {
      employeeId,
      leaveTypeId,
      year,
    });

    if (oldTotalDays === newTotalDays) {
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from("hr_leave_requests")
      .update({
        total_days: newTotalDays,
      })
      .eq("id", request.id);

    if (updateError) {
      throw new Error("Failed to update affected leave request.");
    }

    recalculatedRequests += 1;

    await supabaseAdmin.from("hr_leave_audit_logs").insert({
      leave_request_id: request.id,
      employee_id: employeeId,
      action,
      old_status: request.status,
      new_status: request.status,
      remarks: `${holidayName || "Public holiday"} on ${holidayDate} changed leave total from ${oldTotalDays} to ${newTotalDays} day(s).`,
      performed_by_role: "employer",
      performed_by_employee_id: null,
    });
  }

  for (const balanceKey of affectedBalanceKeys.values()) {
    await recalculateEmployeeLeaveBalance(balanceKey);
  }

  return {
    affectedRequests: affectedRequests?.length || 0,
    recalculatedRequests,
  };
}