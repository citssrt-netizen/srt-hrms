"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type EmployeeProfilePhotoProps = {
  employeeId: number;
  currentPhotoUrl?: string | null;
  employeeName: string;
};

export function EmployeeProfilePhoto({
  employeeId,
  currentPhotoUrl,
  employeeName,
}: EmployeeProfilePhotoProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const initials = employeeName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleUpload() {
    if (!selectedFile) {
      setMessage("Please select a profile photo first.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const response = await fetch(`/api/employees/${employeeId}/photo`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload profile photo.");
      }

      const previewResponse = await fetch(
        `/api/employees/${employeeId}/photo/url`,
        {
          cache: "no-store",
        }
      );

      const previewResult = await previewResponse.json();

      if (!previewResponse.ok) {
        throw new Error(
          previewResult.error || "Failed to refresh profile photo."
        );
      }

      setPhotoUrl(previewResult.url || "");
      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setMessage("Profile photo updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload profile photo."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={employeeName}
              className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-600 shadow-sm">
              {initials}
            </div>
          )}

          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Profile Photo
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Upload a professional employee profile photo.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                Choose Photo

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />
              </label>

              {selectedFile ? (
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {selectedFile.name}
                </span>
              ) : (
                <span className="text-sm text-slate-400">
                  No photo selected
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? "Uploading..." : "Upload Photo"}
        </Button>
      </div>

      {message ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          {message}
        </div>
      ) : null}
    </div>
  );
}