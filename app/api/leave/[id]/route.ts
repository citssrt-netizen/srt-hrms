import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { recalculateEmployeeLeaveBalance } from "@/lib/leave/recalculateEmployeeLeaveBalance";
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

    await recalculateEmployeeLeaveBalance({
      employeeId: Number(existingRequest.employee_id),
      leaveTypeId: Number(existingRequest.leave_type_id),
      year: leaveYear,
    });

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