"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type MasterDataItem = {
  id: number;
  category: string;
  name: string;
};

type EmployeeFormProps = {
  mode?: "create" | "edit";
  employeeId?: number;
  initialData?: Record<string, any>;
  masterData?: MasterDataItem[];
};

export function EmployeeForm({
  mode = "create",
  employeeId,
  initialData = {},
  masterData = [],
}: EmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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

    const res = await fetch(
      mode === "edit" ? `/api/employees/${employeeId}` : "/api/employees",
      {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Failed to save employee.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    if (mode === "create") {
      form.reset();
      setMessage("Employee saved successfully.");
      router.refresh();
      return;
    }

    setMessage("Employee updated successfully.");
    router.push(`/employees/${employeeId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <SectionTitle
          title="General Information"
          description="Basic employee identity and profile details."
        />

        <div className="grid gap-5 md:grid-cols-3">
          <Field name="staff_no" label="Staff No" initialData={initialData} />

          <SelectField
            name="employment_type_id"
            label="Employment Type"
            options={optionsFor("employment_type")}
            initialData={initialData}
          />

          <Field
            name="full_name"
            label="Full Name"
            required
            initialData={initialData}
          />

          <Field
            name="date_of_birth"
            label="Date of Birth"
            type="date"
            initialData={initialData}
          />

          <SelectField
            name="gender"
            label="Gender"
            options={optionsFor("gender")}
            initialData={initialData}
          />

          <SelectField
            name="marital_status"
            label="Marital Status"
            options={optionsFor("marital_status")}
            initialData={initialData}
          />

          <Field name="ic_number" label="IC No" initialData={initialData} />

          <SelectField
            name="race"
            label="Race"
            options={optionsFor("race")}
            initialData={initialData}
          />

          <SelectField
            name="religion"
            label="Religion"
            options={optionsFor("religion")}
            initialData={initialData}
          />

          <SelectField
            name="nationality"
            label="Nationality"
            options={optionsFor("nationality")}
            initialData={initialData}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <SectionTitle
          title="Contact Information"
          description="Address, contact details, and emergency contact."
        />

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            name="address_line_1"
            label="Address Line 1"
            initialData={initialData}
          />

          <Field
            name="address_line_2"
            label="Address Line 2"
            initialData={initialData}
          />

          <Field
            name="address_line_3"
            label="Address Line 3"
            initialData={initialData}
          />

          <Field name="postcode" label="Postcode" initialData={initialData} />

          <SelectField
            name="state"
            label="State"
            options={optionsFor("state")}
            initialData={initialData}
          />

          <Field
            name="email"
            label="Email"
            type="email"
            initialData={initialData}
          />

          <Field name="phone" label="Mobile No" initialData={initialData} />

          <Field
            name="emergency_contact_name"
            label="Emergency Contact Name"
            initialData={initialData}
          />

          <Field
            name="emergency_contact_phone"
            label="Emergency Contact No."
            initialData={initialData}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <SectionTitle
          title="Employment Information"
          description="Controlled HR master-data fields for reporting, leave, payroll, and policies."
        />

        <div className="grid gap-5 md:grid-cols-3">
          <SelectField
            name="business_unit_id"
            label="Business Unit"
            options={optionsFor("business_unit")}
            initialData={initialData}
          />

          <SelectField
            name="branch_id"
            label="Branch"
            options={optionsFor("branch")}
            initialData={initialData}
          />

          <SelectField
            name="division_id"
            label="Division"
            options={optionsFor("division")}
            initialData={initialData}
          />

          <SelectField
            name="department_id"
            label="Department"
            options={optionsFor("department")}
            initialData={initialData}
          />

          <SelectField
            name="designation_id"
            label="Designation"
            options={optionsFor("designation")}
            initialData={initialData}
          />

          <Field name="position" label="Position" initialData={initialData} />

          <SelectField
            name="staff_type_id"
            label="Staff Type"
            options={optionsFor("staff_type")}
            initialData={initialData}
          />

          <SelectField
            name="employment_status_id"
            label="Employment Status"
            options={optionsFor("employment_status")}
            initialData={initialData}
          />

          <Field
            name="joined_date"
            label="Joined Date"
            type="date"
            initialData={initialData}
          />
        </div>
      </section>

      {message ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "edit"
              ? "Update Employee"
              : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  initialData: Record<string, any>;
};

function Field({
  name,
  label,
  type = "text",
  defaultValue = "",
  required = false,
  initialData,
}: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={initialData[name] ?? defaultValue}
        required={required}
      />
    </div>
  );
}

type SelectFieldProps = {
  name: string;
  label: string;
  options: MasterDataItem[];
  required?: boolean;
  initialData: Record<string, any>;
};

function SelectField({
  name,
  label,
  options,
  required = false,
  initialData,
}: SelectFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>

      <select
        id={name}
        name={name}
        defaultValue={initialData[name] ?? ""}
        required={required}
        className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}