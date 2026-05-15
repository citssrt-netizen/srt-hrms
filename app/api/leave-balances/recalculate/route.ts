import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { recalculateEmployeeLeaveBalance } from "@/lib/leave/recalculateEmployeeLeaveBalance";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  let requestedYear: number | null = null;

  try {
    const body = await request.json().catch(() => ({}));
    requestedYear = body.year ? Number(body.year) : null;
  } catch {
    requestedYear = null;
  }

  const year =
    requestedYear && Number.isInteger(requestedYear)
      ? requestedYear
      : new Date().getFullYear();

  const { data: employees, error: employeesError } = await supabaseAdmin
    .from("hr_employees")
    .select("id")
    .eq("employment_status", "Active");

  if (employeesError) {
    return NextResponse.json(
      { error: "Failed to load active employees." },
      { status: 500 }
    );
  }

  const { data: leaveTypes, error: leaveTypesError } = await supabaseAdmin
    .from("hr_leave_types")
    .select("id");

  if (leaveTypesError) {
    return NextResponse.json(
      { error: "Failed to load leave types." },
      { status: 500 }
    );
  }

  let recalculatedCount = 0;

  try {
    for (const employee of employees || []) {
      for (const leaveType of leaveTypes || []) {
        await recalculateEmployeeLeaveBalance({
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year,
        });

        recalculatedCount += 1;
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to recalculate leave balances." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    year,
    recalculatedCount,
  });
}