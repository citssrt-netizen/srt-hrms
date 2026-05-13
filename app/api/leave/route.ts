import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isValidDate(value: unknown) {
  if (typeof value !== "string" || !value) return false;

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

function calculateTotalDays(
  startDateValue: string,
  endDateValue: string,
  isHalfDay: boolean
) {
  if (isHalfDay) {
    return 0.5;
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  const differenceMs = endDate.getTime() - startDate.getTime();
  const differenceDays = Math.floor(differenceMs / 86400000) + 1;

  return differenceDays;
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

  const totalDays = calculateTotalDays(startDate, endDate, isHalfDay);

  if (totalDays <= 0) {
    return NextResponse.json(
      { error: "Leave duration must be more than 0 days." },
      { status: 400 }
    );
  }

  const { data: leaveType, error: leaveTypeError } = await supabaseAdmin
    .from("hr_leave_types")
    .select("id")
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

  return NextResponse.json({ leaveRequest }, { status: 201 });
}