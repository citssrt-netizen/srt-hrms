"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LeaveApprovalActionsProps = {
  leaveRequestId: number;
  currentStatus: string;
};

export function LeaveApprovalActions({
  leaveRequestId,
  currentStatus,
}: LeaveApprovalActionsProps) {
  const router = useRouter();

  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAction(status: "approved" | "rejected") {
    setIsSubmitting(true);

    const response = await fetch(`/api/leave/${leaveRequestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        employer_remark: remark,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const result = await response.json();

      alert(result.error || "Failed to update leave request.");

      return;
    }

    router.refresh();
  }

  if (currentStatus !== "pending") {
    return (
      <div className="text-xs font-medium text-slate-400">
        Finalized
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={remark}
        onChange={(event) => setRemark(event.target.value)}
        rows={2}
        placeholder="Employer remark (optional)"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-950 outline-none transition focus:border-slate-500"
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleAction("approved")}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Approve
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleAction("rejected")}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Reject
        </button>
      </div>
    </div>
  );
}