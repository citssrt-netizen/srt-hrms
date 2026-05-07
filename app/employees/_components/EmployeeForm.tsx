"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type EmployeeFormProps = {
  mode?: "create" | "edit";
  employeeId?: number;
  initialData?: Record<string, any>;
};

export function EmployeeForm({
  mode = "create",
  employeeId,
  initialData = {},
}: EmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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
          <Field
            name="employment_type"
            label="Employment Type"
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
          <Field name="gender" label="Gender" initialData={initialData} />
          <Field
            name="marital_status"
            label="Marital Status"
            initialData={initialData}
          />
          <Field name="ic_number" label="IC No" initialData={initialData} />
          <Field name="race" label="Race" initialData={initialData} />
          <Field name="religion" label="Religion" initialData={initialData} />
          <Field
            name="nationality"
            label="Nationality"
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
          <Field name="state" label="State" initialData={initialData} />
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
          description="Job assignment, department, branch, and employment status."
        />

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            name="business_unit"
            label="Business Unit"
            initialData={initialData}
          />
          <Field name="branch" label="Branch" initialData={initialData} />
          <Field name="division" label="Division" initialData={initialData} />
          <Field
            name="department"
            label="Department"
            initialData={initialData}
          />
          <Field
            name="designation"
            label="Designation"
            initialData={initialData}
          />
          <Field name="position" label="Position" initialData={initialData} />
          <Field
            name="staff_type"
            label="Staff Type"
            initialData={initialData}
          />
          <Field
            name="employment_status"
            label="Employment Status"
            defaultValue="Active"
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