"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublicHolidayForm() {
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

    const response = await fetch("/api/public-holidays", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        holiday_date: formData.get("holiday_date"),
        name: formData.get("name"),
        state: formData.get("state"),
        is_national: formData.get("is_national") === "on",
      }),
    });

    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage({
        type: "error",
        text: result.error || "Failed to create public holiday.",
      });

      return;
    }

    form.reset();

    setMessage({
      type: "success",
      text: "Public holiday created successfully.",
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
          Holiday Setup
        </p>

        <h3 className="mt-2 text-xl font-bold text-slate-950">
          Add Public Holiday
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add national or state-specific public holidays for the leave
          calculation engine.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="holiday_date"
            className="text-sm font-semibold text-slate-700"
          >
            Holiday Date
          </label>

          <input
            id="holiday_date"
            name="holiday_date"
            type="date"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="text-sm font-semibold text-slate-700"
          >
            Holiday Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Example: Hari Raya Aidilfitri"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="state"
            className="text-sm font-semibold text-slate-700"
          >
            State
          </label>

          <input
            id="state"
            name="state"
            type="text"
            placeholder="Optional, example: Selangor"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="is_national"
            className="text-sm font-semibold text-slate-700"
          >
            Holiday Type
          </label>

          <label className="mt-2 flex min-h-[46px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
            <input
              id="is_national"
              name="is_national"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300"
            />
            National public holiday
          </label>
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
          {isSubmitting ? "Saving..." : "Add Public Holiday"}
        </button>
      </div>
    </form>
  );
}