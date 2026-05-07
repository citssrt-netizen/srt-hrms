"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type Employee = {
  id: number;
  staff_no: string | null;
  full_name: string;
  ic_number: string | null;
  department: string | null;
  designation: string | null;
  employment_status: string;
};

type EmployeeDirectoryProps = {
  employees: Employee[];
};

const EMPLOYEES_PER_PAGE = 10;

export function EmployeeDirectory({ employees }: EmployeeDirectoryProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((employee) => employee.employment_status)
          .filter(Boolean)
      )
    );
  }, [employees]);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((employee) => employee.department)
          .filter((department): department is string =>
            Boolean(department)
          )
      )
    ).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return employees.filter((employee) => {
      const matchesSearch =
        !keyword ||
        employee.full_name.toLowerCase().includes(keyword) ||
        String(employee.staff_no ?? "").toLowerCase().includes(keyword) ||
        String(employee.ic_number ?? "").toLowerCase().includes(keyword);

      const matchesStatus =
        status === "all" || employee.employment_status === status;

      const matchesDepartment =
        department === "all" || employee.department === department;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, search, status, department]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEmployees = filteredEmployees.slice(
    (safeCurrentPage - 1) * EMPLOYEES_PER_PAGE,
    safeCurrentPage * EMPLOYEES_PER_PAGE
  );

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="employee-search">Search Employees</Label>

          <Input
            id="employee-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by name, staff no, or IC no"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employee-status">Status</Label>

          <select
            id="employee-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              resetToFirstPage();
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="all">All statuses</option>

            {statuses.map((employeeStatus) => (
              <option key={employeeStatus} value={employeeStatus}>
                {employeeStatus}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="employee-department">Department</Label>

          <select
            id="employee-department"
            value={department}
            onChange={(event) => {
              setDepartment(event.target.value);
              resetToFirstPage();
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="all">All departments</option>

            {departments.map((employeeDepartment) => (
              <option
                key={employeeDepartment}
                value={employeeDepartment}
              >
                {employeeDepartment}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
        <div>
          Showing {paginatedEmployees.length} of{" "}
          {filteredEmployees.length} matched employees
          <span className="text-slate-400">
            {" "}
            / {employees.length} total
          </span>
        </div>

        <div>
          Page {safeCurrentPage} of {totalPages}
        </div>
      </div>

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
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  No employees match your search.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-slate-50"
                >
                  <Cell href={`/employees/${employee.id}`}>
                    {employee.staff_no || "-"}
                  </Cell>

                  <Cell
                    href={`/employees/${employee.id}`}
                    strong
                  >
                    {employee.full_name}
                  </Cell>

                  <Cell href={`/employees/${employee.id}`}>
                    {employee.ic_number || "-"}
                  </Cell>

                  <Cell href={`/employees/${employee.id}`}>
                    {employee.department || "-"}
                  </Cell>

                  <Cell href={`/employees/${employee.id}`}>
                    {employee.designation || "-"}
                  </Cell>

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

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) => Math.max(1, page - 1))
          }
          disabled={safeCurrentPage === 1}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) =>
              Math.min(totalPages, page + 1)
            )
          }
          disabled={safeCurrentPage === totalPages}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Cell({
  href,
  children,
  strong = false,
}: {
  href: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 ${
        strong
          ? "font-medium text-slate-950"
          : "text-slate-600"
      }`}
    >
      <Link href={href} className="block">
        {children}
      </Link>
    </td>
  );
}