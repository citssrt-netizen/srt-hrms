"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteHolidayButtonProps = {
  holidayId: number;
  holidayName: string;
};

export function DeleteHolidayButton({
  holidayId,
  holidayName,
}: DeleteHolidayButtonProps) {
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete public holiday "${holidayName}"?`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(
      `/api/public-holidays/${holidayId}`,
      {
        method: "DELETE",
      }
    );

    setIsDeleting(false);

    if (!response.ok) {
      const result = await response.json();

      alert(result.error || "Failed to delete public holiday.");

      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}