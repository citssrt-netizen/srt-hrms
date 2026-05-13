"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LeaveType = {
  id: number;
  name: string;
  code: string;
  default_days: number;
};

type LeaveApplicationFormProps = {
  leaveTypes: LeaveType[];
};

export function LeaveApplicationForm({
  leaveTypes,
}: LeaveApplicationFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leave_type_id: formData.get("leave_type_id"),
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
        is_half_day: formData.get("is_half_day") === "on",
        reason: formData.get("reason"),
      }),
    });

    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage({
        type: "error",
        text: result.error || "Failed to submit leave request.",
      });

      return;
    }

    form.reset();

    setMessage({
      type: "success",
      text: "Leave request submitted successfully.",
    });

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold text-slate-500">
          Leave Application
        </p>

        <h3 className="mt-2 text-xl font-bold text-slate-950">
          Submit Leave Request
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Submit your leave request for employer review. Weekend, public holiday,
          entitlement balance, MC attachment, and advanced Malaysian HR policy
          checks will be added in later milestones.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="leave_type_id"
            className="text-sm font-semibold text-slate-700"
          >
            Leave Type
          </label>

          <select
            id="leave_type_id"
            name="leave_type_id"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          >
            <option value="">Select leave type</option>

            {leaveTypes.map((leaveType) => (
              <option key={leaveType.id} value={leaveType.id}>
                {leaveType.name} ({leaveType.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="is_half_day"
            className="text-sm font-semibold text-slate-700"
          >
            Duration Type
          </label>

          <label className="mt-2 flex min-h-[46px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
            <input
              id="is_half_day"
              name="is_half_day"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
            />
            Half-day leave
          </label>
        </div>

        <div>
          <label
            htmlFor="start_date"
            className="text-sm font-semibold text-slate-700"
          >
            Start Date
          </label>

          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="end_date"
            className="text-sm font-semibold text-slate-700"
          >
            End Date
          </label>

          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="reason"
            className="text-sm font-semibold text-slate-700"
          >
            Reason
          </label>

          <textarea
            id="reason"
            name="reason"
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
            placeholder="Optional reason or remarks"
          />
        </div>
      </div>

      {message ? (
        <div
          className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Submitting..." : "Submit Leave Request"}
        </button>
      </div>
    </form>
  );
}