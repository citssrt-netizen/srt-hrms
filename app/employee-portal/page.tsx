import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEmployee(employeeId: number) {
  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .select(
      "id, staff_no, full_name, department, designation, employment_status, joined_date, email, phone"
    )
    .eq("id", employeeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

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

export default async function EmployeePortalPage() {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee" || !session.employeeId) {
    redirect("/login");
  }

  const employee = await getEmployee(session.employeeId);

  if (!employee) {
    redirect("/login");
  }

  return (
    <AppShell title="Employee Portal">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Welcome back,
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            {employee.full_name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {employee.staff_no || "-"} · {employee.designation || "-"}
          </p>

          <form action="/api/auth/logout" method="post" className="mt-5">
            <button className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              Logout
            </button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Status</CardDescription>
              <CardTitle>{employee.employment_status || "-"}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Department</CardDescription>
              <CardTitle>{employee.department || "-"}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Joined Date</CardDescription>
              <CardTitle>{formatDate(employee.joined_date)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Self Service</CardDescription>
              <CardTitle>Active</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              View your HR profile and employment information.
            </CardDescription>
          </CardHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Email" value={employee.email} />
            <InfoItem label="Phone" value={employee.phone} />
            <InfoItem label="Department" value={employee.department} />
            <InfoItem label="Designation" value={employee.designation} />
          </div>

          <div className="mt-5">
            <Link
              href={`/employees/${employee.id}`}
              className="text-sm font-semibold text-slate-700 hover:text-slate-950"
            >
              View full HR profile →
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-950">
        {value || "-"}
      </p>
    </div>
  );
}