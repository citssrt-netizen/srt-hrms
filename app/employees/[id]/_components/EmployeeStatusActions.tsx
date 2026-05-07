"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const EMPLOYEE_STATUSES = [
  "Active",
  "Inactive",
  "Resigned",
  "Terminated",
  "On Leave",
];

type EmployeeStatusActionsProps = {
  employeeId: number;
  currentStatus: string | null;
};

export function EmployeeStatusActions({
  employeeId,
  currentStatus,
}: EmployeeStatusActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus || "Active");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpdateStatus() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-status",
          employment_status: status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update employee status");
      }

      setMessage("Employee status updated successfully.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update employee status"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Employment Status
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Update the employee&apos;s current HR status.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-48"
          >
            {EMPLOYEE_STATUSES.map((employeeStatus) => (
              <option key={employeeStatus} value={employeeStatus}>
                {employeeStatus}
              </option>
            ))}
          </select>

          <Button
            type="button"
            onClick={handleUpdateStatus}
            disabled={isSaving || status === (currentStatus || "Active")}
          >
            {isSaving ? "Saving..." : "Update Status"}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
      ) : null}
    </div>
  );
}