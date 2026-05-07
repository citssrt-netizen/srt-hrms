import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EmployeeStatusActions } from "./_components/EmployeeStatusActions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getEmployee(id: string) {
  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

function formatDate(value: unknown) {
  if (!value) return "-";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: unknown) {
  const value = String(status || "Active").toLowerCase();

  if (value === "active") return "bg-emerald-50 text-emerald-700";
  if (value === "inactive") return "bg-slate-100 text-slate-700";
  if (value === "resigned") return "bg-slate-100 text-slate-700";
  if (value === "terminated") return "bg-red-50 text-red-700";
  if (value === "suspended") return "bg-red-50 text-red-700";
  if (value === "on leave") return "bg-amber-50 text-amber-700";

  return "bg-amber-50 text-amber-700";
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  return (
    <AppShell title="Employee Profile">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/employees"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Back to Employees
          </Link>

          <Link href={`/employees/${employee.id}/edit`}>
            <Button type="button">Edit Employee</Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {employee.staff_no || "No staff number"}
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {employee.full_name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {employee.designation || employee.position || "No designation"}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                employee.employment_status
              )}`}
            >
              {employee.employment_status || "Active"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SummaryCard label="Department" value={employee.department} />
            <SummaryCard label="Branch" value={employee.branch} />
            <SummaryCard
              label="Joined Date"
              value={formatDate(employee.joined_date)}
            />
          </div>
        </div>

        <EmployeeStatusActions
          employeeId={employee.id}
          currentStatus={employee.employment_status}
        />

        <ProfileSection
          title="General Information"
          description="Identity and personal details."
          items={[
            ["Staff No", employee.staff_no],
            ["Employment Type", employee.employment_type],
            ["Full Name", employee.full_name],
            ["Date of Birth", formatDate(employee.date_of_birth)],
            ["Gender", employee.gender],
            ["Marital Status", employee.marital_status],
            ["IC No", employee.ic_number],
            ["Race", employee.race],
            ["Religion", employee.religion],
            ["Nationality", employee.nationality],
          ]}
        />

        <ProfileSection
          title="Contact Information"
          description="Address, phone, email, and emergency contact."
          items={[
            ["Address Line 1", employee.address_line_1],
            ["Address Line 2", employee.address_line_2],
            ["Address Line 3", employee.address_line_3],
            ["Postcode", employee.postcode],
            ["State", employee.state],
            ["Email", employee.email],
            ["Mobile No", employee.phone],
            ["Emergency Contact Name", employee.emergency_contact_name],
            ["Emergency Contact No.", employee.emergency_contact_phone],
          ]}
        />

        <ProfileSection
          title="Employment Information"
          description="Department, branch, role, and joining details."
          items={[
            ["Business Unit", employee.business_unit],
            ["Branch", employee.branch],
            ["Division", employee.division],
            ["Department", employee.department],
            ["Designation", employee.designation],
            ["Position", employee.position],
            ["Staff Type", employee.staff_type],
            ["Employment Status", employee.employment_status],
            ["Joined Date", formatDate(employee.joined_date)],
          ]}
        />
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-950">
        {String(value || "-")}
      </p>
    </div>
  );
}

type ProfileSectionProps = {
  title: string;
  description: string;
  items: [string, unknown][];
};

function ProfileSection({ title, description, items }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </dt>

            <dd className="mt-1 text-sm font-medium text-slate-950">
              {String(value || "-")}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}