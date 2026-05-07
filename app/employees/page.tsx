import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EmployeeDirectory } from "./_components/EmployeeDirectory";
import { EmployeeForm } from "./_components/EmployeeForm";

type Employee = {
  id: number;
  staff_no: string | null;
  full_name: string;
  ic_number: string | null;
  department: string | null;
  designation: string | null;
  employment_status: string;
};

async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .select(
      "id, staff_no, full_name, ic_number, department, designation, employment_status"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load employees:", error);
    throw new Error(`Failed to load employees: ${error.message}`);
  }

  return data ?? [];
}

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <AppShell title="Employees">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Employee Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage staff profiles, employment details, and HR records.
            </p>
          </div>

          <Button type="button">Add Employee</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Employee</CardTitle>
            <CardDescription>
              Create a new employee profile for HR records.
            </CardDescription>
          </CardHeader>

          <EmployeeForm />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>
              Search, filter, and open employee HR profiles.
            </CardDescription>
          </CardHeader>

          <EmployeeDirectory employees={employees} />
        </Card>
      </div>
    </AppShell>
  );
}