import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeavePolicyForm } from "./_components/LeavePolicyForm";
import { LeavePolicyActions } from "./_components/LeavePolicyActions";
import { RecalculateLeaveBalancesButton } from "./_components/RecalculateLeaveBalancesButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MasterDataItem = {
  id: number;
  category: string;
  name: string;
};

async function getLeaveTypes() {
  const { data, error } = await supabaseAdmin
    .from("hr_leave_types")
    .select("id, name, code")
    .order("name", { ascending: true });

  if (error) return [];

  return data || [];
}

async function getMasterData(): Promise<MasterDataItem[]> {
  const { data, error } = await supabaseAdmin
    .from("hr_master_data_items")
    .select("id, category, name")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return [];

  return data || [];
}

async function getLeavePolicies() {
  const { data, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .select(
      `
      *,
      hr_leave_types (
        id,
        name,
        code
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) return [];

  return data || [];
}

function showScope(value: string | null | undefined) {
  return value || "All";
}

export default async function LeavePoliciesPage() {
  const [leaveTypes, policies, masterData] = await Promise.all([
    getLeaveTypes(),
    getLeavePolicies(),
    getMasterData(),
  ]);

  return (
    <AppShell title="Leave Policies">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Leave Management
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                Leave Policy Settings
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Configure entitlement days, proration, carry-forward,
                attachments, and employee-scope rules such as department,
                branch, business unit, and staff type.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <RecalculateLeaveBalancesButton />

              <Link href="/leave">
                <Button type="button" variant="secondary">
                  Back to Leave
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <LeavePolicyForm
          leaveTypes={leaveTypes}
          masterData={masterData}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Existing Policies
            </h2>

            <p className="text-sm text-slate-500">
              Manage active and inactive leave policy rules. Blank scope fields
              mean the policy applies to all employees in that category.
            </p>
          </div>

          {policies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No leave policies created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Policy</th>
                    <th className="px-3 py-3">Leave Type</th>
                    <th className="px-3 py-3">Employment</th>
                    <th className="px-3 py-3">Org Scope</th>
                    <th className="px-3 py-3">Service Months</th>
                    <th className="px-3 py-3">Entitlement</th>
                    <th className="px-3 py-3">Proration</th>
                    <th className="px-3 py-3">Carry Forward</th>
                    <th className="px-3 py-3">Attachment</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {policies.map((policy: any) => (
                    <tr
                      key={policy.id}
                      className="border-b border-slate-100 align-top last:border-0"
                    >
                      <td className="px-3 py-4 font-medium text-slate-950">
                        <div>{policy.policy_name}</div>

                        <div className="mt-1 text-xs font-normal text-slate-500">
                          ID: {policy.id}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        <div>{policy.hr_leave_types?.name || "-"}</div>

                        <div className="mt-1 text-xs text-slate-400">
                          {policy.hr_leave_types?.code || "-"}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        <div>
                          Type: {showScope(policy.employment_type)}
                        </div>

                        <div className="mt-1">
                          Status: {showScope(policy.employment_status)}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        <div>Branch: {showScope(policy.branch)}</div>

                        <div className="mt-1">
                          Dept: {showScope(policy.department)}
                        </div>

                        <div className="mt-1">
                          BU: {showScope(policy.business_unit)}
                        </div>

                        <div className="mt-1">
                          Staff: {showScope(policy.staff_type)}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {policy.min_service_months ?? 0} -{" "}
                        {policy.max_service_months ?? "∞"}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {policy.entitlement_days} day(s)
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {policy.allow_proration ? "Yes" : "No"}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {policy.allow_carry_forward ? (
                          <div>
                            <div>
                              Max: {policy.max_carry_forward_days || 0} day(s)
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              Expiry month:{" "}
                              {policy.carry_forward_expiry_month || "None"}
                            </div>
                          </div>
                        ) : (
                          "No"
                        )}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {policy.requires_attachment ? "Required" : "Optional"}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            policy.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {policy.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-right">
                        <LeavePolicyActions policy={policy} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}