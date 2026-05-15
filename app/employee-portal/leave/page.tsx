import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentSession } from "@/lib/auth/session";
import { LeaveApplicationForm } from "./_components/LeaveApplicationForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeaveType = {
  id: number;
  name: string;
  code: string;
  default_days: number;
};

type LeaveBalance = {
  leave_type_id: number;
  entitlement_days: number;
  carried_forward_days: number;
  used_days: number;
  pending_days: number;
  balance_days: number;
};

type LeaveRequest = {
  id: number;
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

export default async function EmployeeLeavePage() {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee" || !session.employeeId) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();

  const [
    { data: leaveTypes },
    { data: leaveRequests },
    { data: leaveBalances },
  ] = await Promise.all([
    supabaseAdmin
      .from("hr_leave_types")
      .select("id, name, code, default_days")
      .order("name", { ascending: true }),

    supabaseAdmin
      .from("hr_leave_requests")
      .select(
        "id, leave_type_id, start_date, end_date, total_days, reason, status, employer_remark, created_at"
      )
      .eq("employee_id", session.employeeId)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("hr_employee_leave_balances")
      .select(
        `
        leave_type_id,
        entitlement_days,
        carried_forward_days,
        used_days,
        pending_days,
        balance_days
      `
      )
      .eq("employee_id", session.employeeId)
      .eq("year", currentYear),
  ]);

  const typedLeaveTypes = (leaveTypes || []) as LeaveType[];
  const typedLeaveRequests = (leaveRequests || []) as LeaveRequest[];
  const typedLeaveBalances = (leaveBalances || []) as LeaveBalance[];

  const leaveTypeMap = new Map(
    typedLeaveTypes.map((leaveType) => [leaveType.id, leaveType])
  );

  const leaveBalanceMap = new Map(
    typedLeaveBalances.map((balance) => [
      balance.leave_type_id,
      balance,
    ])
  );

  return (
    <AppShell title="My Leave">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Leave Management
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                My Leave
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                View your leave entitlement, submit applications, and track
                approval status. This module is being built with Malaysian
                corporate HR workflows in mind.
              </p>
            </div>
          </div>
        </div>

        <LeaveApplicationForm leaveTypes={typedLeaveTypes} />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {typedLeaveTypes.map((leaveType) => {
            const leaveBalance = leaveBalanceMap.get(leaveType.id);

            const entitlementDays = Number(
              leaveBalance?.entitlement_days ??
                leaveType.default_days ??
                0
            );

            const usedDays = Number(leaveBalance?.used_days || 0);

            const pendingDays = Number(leaveBalance?.pending_days || 0);

            const balanceDays = Number(leaveBalance?.balance_days || 0);

            return (
              <div
                key={leaveType.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {leaveType.code}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      {leaveType.name}
                    </h3>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {entitlementDays} days
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Used
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {usedDays}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700">
                      Pending
                    </p>

                    <p className="mt-1 text-lg font-bold text-amber-700">
                      {pendingDays}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-700">
                      Balance
                    </p>

                    <p className="mt-1 text-lg font-bold text-emerald-700">
                      {balanceDays}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-lg font-bold text-slate-950">
              Leave Request History
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your submitted leave requests and employer remarks will appear
              here.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Leave Type</th>
                  <th className="px-6 py-4 font-semibold">Start</th>
                  <th className="px-6 py-4 font-semibold">End</th>
                  <th className="px-6 py-4 font-semibold">Days</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">
                    Employer Remark
                  </th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {typedLeaveRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  typedLeaveRequests.map((request) => {
                    const leaveType = leaveTypeMap.get(
                      request.leave_type_id
                    );

                    return (
                      <tr key={request.id}>
                        <td className="px-6 py-4 font-medium text-slate-950">
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
                          {request.employer_remark || "-"}
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