"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type LeaveType = {
  id: number;
  name: string;
  code: string | null;
};

type MasterDataItem = {
  id: number;
  category: string;
  name: string;
};

type LeavePolicyFormProps = {
  leaveTypes: LeaveType[];
  masterData: MasterDataItem[];
};

export function LeavePolicyForm({
  leaveTypes,
  masterData,
}: LeavePolicyFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function optionsFor(category: string) {
    return masterData.filter((item) => item.category === category);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/leave-policies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(data.error || "Failed to save leave policy.");
      return;
    }

    form.reset();
    setMessage("Leave policy saved successfully.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Add Leave Policy
        </h2>
        <p className="text-sm text-slate-500">
          Create configurable HR leave rules. Blank scope fields mean the policy
          applies to all employees in that category.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="leave_type_id">Leave Type</Label>
          <select
            id="leave_type_id"
            name="leave_type_id"
            required
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none focus:border-slate-900"
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType.id} value={leaveType.id}>
                {leaveType.name}
                {leaveType.code ? ` (${leaveType.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <Field name="policy_name" label="Policy Name" required />

        <SelectField
          name="employment_type_id"
          label="Employment Type Scope"
          options={optionsFor("employment_type")}
        />

        <SelectField
          name="employment_status_id"
          label="Employment Status Scope"
          options={optionsFor("employment_status")}
        />

        <SelectField
          name="branch_id"
          label="Branch Scope"
          options={optionsFor("branch")}
        />

        <SelectField
          name="department_id"
          label="Department Scope"
          options={optionsFor("department")}
        />

        <SelectField
          name="business_unit_id"
          label="Business Unit Scope"
          options={optionsFor("business_unit")}
        />

        <SelectField
          name="staff_type_id"
          label="Staff Type Scope"
          options={optionsFor("staff_type")}
        />

        <Field
          name="min_service_months"
          label="Min Service Months"
          type="number"
          defaultValue="0"
        />

        <Field
          name="max_service_months"
          label="Max Service Months"
          type="number"
        />

        <Field
          name="entitlement_days"
          label="Entitlement Days"
          type="number"
          step="0.5"
          required
        />

        <Field
          name="max_carry_forward_days"
          label="Max Carry Forward Days"
          type="number"
          step="0.5"
          defaultValue="0"
        />

        <Field
          name="carry_forward_expiry_month"
          label="Carry Forward Expiry Month"
          type="number"
          min="1"
          max="12"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Checkbox name="allow_proration" label="Allow Proration" defaultChecked />
        <Checkbox name="allow_carry_forward" label="Allow Carry Forward" />
        <Checkbox name="requires_attachment" label="Requires Attachment" />
        <Checkbox name="is_active" label="Active Policy" defaultChecked />
      </div>

      {message ? (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Policy"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  step,
  min,
  max,
  defaultValue = "",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: MasterDataItem[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>

      <select
        id={name}
        name={name}
        defaultValue=""
        className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none focus:border-slate-900"
      >
        <option value="">All {label.replace(" Scope", "")}</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300"
      />
      {label}
    </label>
  );
}