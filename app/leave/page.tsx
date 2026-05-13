import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Employee = {
  id: number;
  staff_no: string | null;
  full_name: string | null;
  department: string | null;
};

type LeaveType = {
  id: number;
  name: string;
  code: string;
};

type LeaveRequest = {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  employer_remark: string | null;
  created_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClassName(status: string) {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700";
  }

  if (status === "cancelled") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

export default async function LeaveManagementPage() {
  const session = await getCurrentSession();

  if (!session || session.role !== "employer") {
    redirect("/login");
  }

  const [
    { data: leaveRequests },
    { data: leaveTypes },
    { data: employees },
  ] = await Promise.all([
    supabaseAdmin
      .from("hr_leave_requests")
      .select(
        "id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, employer_remark, created_at"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("hr_leave_types")
      .select("id, name, code")
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("hr_employees")
      .select("id, staff_no, full_name, department")
      .order("full_name", { ascending: true }),
  ]);

  const employeeMap = new Map(
    ((employees || []) as Employee[]).map((employee) => [
      employee.id,
      employee,
    ])
  );

  const leaveTypeMap = new Map(
    ((leaveTypes || []) as LeaveType[]).map((leaveType) => [
      leaveType.id,
      leaveType,
    ])
  );

  return (
    <AppShell title="Leave Management">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Employer Module
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Leave Management
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review employee leave requests. Approval and rejection actions will
            be enabled in the next milestone after the submission flow is added.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Requests
            </p>

            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              {((leaveRequests || []) as LeaveRequest[]).length}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Pending</p>

            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              {
                ((leaveRequests || []) as LeaveRequest[]).filter(
                  (request) => request.status === "pending"
                ).length
              }
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Approved</p>

            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              {
                ((leaveRequests || []) as LeaveRequest[]).filter(
                  (request) => request.status === "approved"
                ).length
              }
            </h3>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-lg font-bold text-slate-950">
              Employee Leave Requests
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Submitted employee leave requests will appear here.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Employee</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Leave Type</th>
                  <th className="px-6 py-4 font-semibold">Start</th>
                  <th className="px-6 py-4 font-semibold">End</th>
                  <th className="px-6 py-4 font-semibold">Days</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {((leaveRequests || []) as LeaveRequest[]).length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  ((leaveRequests || []) as LeaveRequest[]).map((request) => {
                    const employee = employeeMap.get(request.employee_id);
                    const leaveType = leaveTypeMap.get(request.leave_type_id);

                    return (
                      <tr key={request.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-950">
                            {employee?.full_name || "-"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {employee?.staff_no || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {employee?.department || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {leaveType?.name || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(request.start_date)}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(request.end_date)}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {request.total_days}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(request.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}