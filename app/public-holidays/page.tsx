import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PublicHolidayForm } from "./_components/PublicHolidayForm";
import { DeleteHolidayButton } from "./_components/DeleteHolidayButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicHoliday = {
  id: number;
  holiday_date: string;
  name: string;
  state: string | null;
  is_national: boolean;
};

function formatDate(value: string) {
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

export default async function PublicHolidaysPage() {
  const session = await getCurrentSession();

  if (!session || session.role !== "employer") {
    redirect("/login");
  }

  const { data: publicHolidays } = await supabaseAdmin
    .from("hr_public_holidays")
    .select("id, holiday_date, name, state, is_national")
    .order("holiday_date", { ascending: true });

  const typedPublicHolidays = (publicHolidays || []) as PublicHoliday[];

  return (
    <AppShell title="Public Holidays">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Employer Module
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Public Holidays
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage Malaysian public holidays used by the leave calculation
            engine. Leave requests automatically exclude configured public
            holidays from total working-day calculations.
          </p>
        </div>

        <PublicHolidayForm />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-lg font-bold text-slate-950">
              Holiday List
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              National and state holidays configured for leave calculations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Holiday Name</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">State</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {typedPublicHolidays.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No public holidays configured yet.
                    </td>
                  </tr>
                ) : (
                  typedPublicHolidays.map((holiday) => (
                    <tr key={holiday.id}>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(holiday.holiday_date)}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-950">
                        {holiday.name}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            holiday.is_national
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {holiday.is_national ? "National" : "State"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {holiday.state || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <DeleteHolidayButton
                          holidayId={holiday.id}
                          holidayName={holiday.name}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}