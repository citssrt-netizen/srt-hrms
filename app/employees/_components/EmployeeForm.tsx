"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function EmployeeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setMessage("");

    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Failed to save employee.");
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setMessage("Employee saved successfully.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            General Information
          </h3>
          <p className="text-sm text-slate-500">
            Basic employee identity and profile details.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field name="staff_no" label="Staff No" placeholder="e.g. SRT001" />
          <Field
            name="employment_type"
            label="Employment Type"
            placeholder="e.g. Permanent"
          />
          <Field
            name="full_name"
            label="Full Name"
            placeholder="Enter full name"
            required
          />
          <Field name="date_of_birth" label="Date of Birth" type="date" />
          <Field name="gender" label="Gender" placeholder="e.g. Female" />
          <Field
            name="marital_status"
            label="Marital Status"
            placeholder="e.g. Married"
          />
          <Field name="ic_number" label="IC No" placeholder="e.g. 900101..." />
          <Field name="race" label="Race" placeholder="e.g. Malay" />
          <Field name="religion" label="Religion" placeholder="e.g. Muslim" />
          <Field
            name="nationality"
            label="Nationality"
            placeholder="e.g. Malaysian"
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Contact Information
          </h3>
          <p className="text-sm text-slate-500">
            Address, contact details, and emergency contact.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            name="address_line_1"
            label="Address Line 1"
            placeholder="Address line 1"
          />
          <Field
            name="address_line_2"
            label="Address Line 2"
            placeholder="Address line 2"
          />
          <Field
            name="address_line_3"
            label="Address Line 3"
            placeholder="Address line 3"
          />
          <Field name="postcode" label="Postcode" placeholder="e.g. 44000" />
          <Field name="state" label="State" placeholder="e.g. Selangor" />
          <Field name="email" label="Email" type="email" placeholder="Email" />
          <Field name="phone" label="Mobile No" placeholder="e.g. 012..." />
          <Field
            name="emergency_contact_name"
            label="Emergency Contact Name"
            placeholder="Emergency contact name"
          />
          <Field
            name="emergency_contact_phone"
            label="Emergency Contact No."
            placeholder="Emergency contact number"
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Employment Information
          </h3>
          <p className="text-sm text-slate-500">
            Job assignment, department, branch, and employment status.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            name="business_unit"
            label="Business Unit"
            placeholder="e.g. West Malaysia"
          />
          <Field name="branch" label="Branch" placeholder="e.g. Central Hub" />
          <Field
            name="division"
            label="Division"
            placeholder="e.g. Operation Division"
          />
          <Field
            name="department"
            label="Department"
            placeholder="e.g. Cash In Transit"
          />
          <Field
            name="designation"
            label="Designation"
            placeholder="e.g. Security Officer"
          />
          <Field
            name="position"
            label="Position"
            placeholder="e.g. HR Assistant"
          />
          <Field
            name="staff_type"
            label="Staff Type"
            placeholder="e.g. CIT"
          />
          <Field
            name="employment_status"
            label="Employment Status"
            placeholder="e.g. Active"
            defaultValue="Active"
          />
          <Field name="joined_date" label="Joined Date" type="date" />
        </div>
      </section>

      {message ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
};

function Field({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  required = false,
}: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}