"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function RecalculateLeaveBalancesButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRecalculate() {
    const confirmed = window.confirm(
      "Recalculate leave balances for all active employees? This will apply the latest active leave policies."
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/leave-balances/recalculate", {
      method: "POST",
    });

    setIsSubmitting(false);

    if (!response.ok) {
      alert("Failed to recalculate leave balances.");
      return;
    }

    alert("Leave balances recalculated successfully.");
    router.refresh();
  }

  return (
    <Button type="button" onClick={handleRecalculate} disabled={isSubmitting}>
      {isSubmitting ? "Recalculating..." : "Recalculate Balances"}
    </Button>
  );
}