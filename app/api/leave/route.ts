import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { calculateLeaveWorkingDays } from "@/lib/leave/calculateLeaveWorkingDays";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isValidDate(value: unknown) {
  if (typeof value !== "string" || !value) return false;

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

function getLeaveYear(startDate: string) {
  const date = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear();
  }

  return date.getFullYear();
}

async function getApprovedLeaveUsage(
  employeeId: number,
  leaveTypeId: number,
  year: number
) {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data, error } = await supabaseAdmin
    .from("hr_leave_requests")
    .select("total_days")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("status", "approved")
    .gte("start_date", yearStart)
    .lte("start_date", yearEnd);

  if (error) {
    throw new Error("Failed to calculate approved leave usage.");
  }

  return (data || []).reduce(
    (total, request) => total + Number(request.total_days || 0),
    0
  );
}

async function getAvailableEntitlementDays(
  employeeId: number,
  leaveTypeId: number,
  year: number,
  defaultDays: number
) {
  const { data: balanceRecord, error: balanceError } = await supabaseAdmin
    .from("hr_employee_leave_balances")
    .select("balance_days")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", year)
    .maybeSingle();

  if (balanceError) {
    throw new Error("Failed to check leave balance.");
  }

  if (balanceRecord) {
    return Number(balanceRecord.balance_days || 0);
  }

  const approvedDays = await getApprovedLeaveUsage(employeeId, leaveTypeId, year);

  return Number(defaultDays || 0) - approvedDays;
}

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(["employee"]);

  if (response) {
    return response;
  }

  if (!session?.employeeId) {
    return NextResponse.json(
      { error: "Employee session not found." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const leaveTypeId = Number(body.leave_type_id);
  const startDate = String(body.start_date || "");
  const endDate = String(body.end_date || "");
  const isHalfDay = Boolean(body.is_half_day);
  const reason = String(body.reason || "").trim();

  if (!leaveTypeId) {
    return NextResponse.json(
      { error: "Please select a leave type." },
      { status: 400 }
    );
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return NextResponse.json(
      { error: "Please select a valid start and end date." },
      { status: 400 }
    );
  }

  if (new Date(endDate) < new Date(startDate)) {
    return NextResponse.json(
      { error: "End date cannot be earlier than start date." },
      { status: 400 }
    );
  }

  if (isHalfDay && startDate !== endDate) {
    return NextResponse.json(
      { error: "Half-day leave must start and end on the same date." },
      { status: 400 }
    );
  }

  let totalDays = 0;

  try {
    totalDays = await calculateLeaveWorkingDays({
      startDateValue: startDate,
      endDateValue: endDate,
      isHalfDay,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to calculate leave working days." },
      { status: 500 }
    );
  }

  if (totalDays <= 0) {
    return NextResponse.json(
      {
        error:
          "Leave duration must be more than 0 working days. Weekends and public holidays are excluded.",
      },
      { status: 400 }
    );
  }

  const { data: leaveType, error: leaveTypeError } = await supabaseAdmin
    .from("hr_leave_types")
    .select("id, default_days")
    .eq("id", leaveTypeId)
    .single();

  if (leaveTypeError || !leaveType) {
    return NextResponse.json(
      { error: "Selected leave type was not found." },
      { status: 400 }
    );
  }

  const { data: overlappingLeave, error: overlapError } = await supabaseAdmin
    .from("hr_leave_requests")
    .select("id")
    .eq("employee_id", session.employeeId)
    .in("status", ["pending", "approved"])
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .maybeSingle();

  if (overlapError) {
    return NextResponse.json(
      { error: "Failed to check existing leave requests." },
      { status: 500 }
    );
  }

  if (overlappingLeave) {
    return NextResponse.json(
      {
        error:
          "You already have a pending or approved leave request within this date range.",
      },
      { status: 400 }
    );
  }

  try {
    const leaveYear = getLeaveYear(startDate);

    const availableDays = await getAvailableEntitlementDays(
      session.employeeId,
      leaveTypeId,
      leaveYear,
      Number(leaveType.default_days || 0)
    );

    if (totalDays > availableDays) {
      return NextResponse.json(
        {
          error: `Insufficient leave balance. Available balance: ${availableDays} day(s).`,
        },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to validate leave entitlement." },
      { status: 500 }
    );
  }

  const { data: leaveRequest, error } = await supabaseAdmin
    .from("hr_leave_requests")
    .insert({
      employee_id: session.employeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason: reason || null,
      is_half_day: isHalfDay,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit leave request." },
      { status: 500 }
    );
  }

  await supabaseAdmin.from("hr_leave_audit_logs").insert({
    leave_request_id: leaveRequest.id,
    employee_id: session.employeeId,
    action: "submitted",
    old_status: null,
    new_status: "pending",
    remarks: reason || null,
    performed_by_role: "employee",
    performed_by_employee_id: session.employeeId,
  });

  return NextResponse.json({ leaveRequest }, { status: 201 });
}