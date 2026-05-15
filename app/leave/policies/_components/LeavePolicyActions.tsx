"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type LeavePolicyActionsProps = {
  policy: any;
};

export function LeavePolicyActions({ policy }: LeavePolicyActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function toggleStatus() {
    setIsSubmitting(true);

    const response = await fetch(`/api/leave-policies/${policy.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...policy,
        leave_type_id: policy.leave_type_id,
        is_active: !policy.is_active,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      alert("Failed to update policy status.");
      return;
    }

    router.refresh();
  }

  async function deletePolicy() {
    const confirmed = window.confirm(
      "Delete this leave policy? This should only be done if it has not been used for HR processing."
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    const response = await fetch(`/api/leave-policies/${policy.id}`, {
      method: "DELETE",
    });

    setIsSubmitting(false);

    if (!response.ok) {
      alert("Failed to delete policy.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={isSubmitting}
        onClick={toggleStatus}
      >
        {policy.is_active ? "Deactivate" : "Activate"}
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={isSubmitting}
        onClick={deletePolicy}
      >
        Delete
      </Button>
    </div>
  );
}