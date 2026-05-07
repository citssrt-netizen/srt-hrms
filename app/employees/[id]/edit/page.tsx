import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EmployeeForm } from "../../_components/EmployeeForm";

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

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  return (
    <AppShell title="Edit Employee">
      <div className="space-y-6">
        <Link
          href={`/employees/${employee.id}`}
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Back to Employee Profile
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Employee</CardTitle>
            <CardDescription>
              Update employee profile and HR information.
            </CardDescription>
          </CardHeader>

          <EmployeeForm
            mode="edit"
            employeeId={employee.id}
            initialData={employee}
          />
        </Card>
      </div>
    </AppShell>
  );
}