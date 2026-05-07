import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
  const res = await fetch("http://localhost:3000/api/employees", {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.employees ?? [];
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
              Click an employee row to view the full HR profile.
            </CardDescription>
          </CardHeader>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Staff No</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">IC No</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No employees found yet.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        <Link
                          href={`/employees/${employee.id}`}
                          className="block"
                        >
                          {employee.staff_no || "-"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        <Link
                          href={`/employees/${employee.id}`}
                          className="block"
                        >
                          {employee.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <Link
                          href={`/employees/${employee.id}`}
                          className="block"
                        >
                          {employee.ic_number || "-"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <Link
                          href={`/employees/${employee.id}`}
                          className="block"
                        >
                          {employee.department || "-"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <Link
                          href={`/employees/${employee.id}`}
                          className="block"
                        >
                          {employee.designation || "-"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/employees/${employee.id}`}
                          className="block"
                        >
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {employee.employment_status}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}