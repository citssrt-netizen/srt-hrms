"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type EmployeeDocument = {
  id: number;
  employee_id: number;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
};

type EmployeeDocumentsProps = {
  employeeId: number;
  showUpload?: boolean;
};

function formatFileSize(size: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function EmployeeDocuments({
  employeeId,
  showUpload = false,
}: EmployeeDocumentsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<EmployeeDocument | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/employees/${employeeId}/documents`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load documents");
      }

      setDocuments(result.documents ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load documents"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage("Please select a document first.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`/api/employees/${employeeId}/documents`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload document");
      }

      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setMessage("Document uploaded successfully.");
      await loadDocuments();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handlePreview(document: EmployeeDocument) {
    setSelectedDocument(document);
    setPreviewUrl("");
    setIsPreviewLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/documents/${document.id}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load preview");
      }

      setPreviewUrl(result.url);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load preview"
      );
      closePreview();
    } finally {
      setIsPreviewLoading(false);
    }
  }

  function closePreview() {
    setSelectedDocument(null);
    setPreviewUrl("");
    setIsPreviewLoading(false);
  }

  useEffect(() => {
    void loadDocuments();
  }, [employeeId]);

  const isImage = selectedDocument?.mime_type?.startsWith("image/");
  const isPdf = selectedDocument?.mime_type === "application/pdf";

  return (
    <>
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Employee Documents
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {showUpload
              ? "Upload and manage HR documents linked to this employee."
              : "View uploaded HR documents linked to this employee."}
          </p>
        </div>

        {showUpload ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-slate-400 hover:bg-slate-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Upload Employee Document
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Supported files: PDF, images, spreadsheets, documents.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                    Choose File

                    <input
                      ref={inputRef}
                      type="file"
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
                      No file selected
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">File Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr
                    key={document.id}
                    onClick={() => handlePreview(document)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {document.file_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {document.mime_type || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(document.uploaded_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDocument ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4"
          onClick={closePreview}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  {selectedDocument.file_name}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Uploaded on {formatDate(selectedDocument.uploaded_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={closePreview}
                className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="border-t border-slate-200 px-5 py-4">
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {isPreviewLoading ? (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                    Loading preview...
                  </div>
                ) : !previewUrl ? (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                    Failed to load preview.
                  </div>
                ) : isImage ? (
                  <img
                    src={previewUrl}
                    alt={selectedDocument.file_name}
                    className="mx-auto max-h-40 rounded-md object-contain"
                  />
                ) : isPdf ? (
                  <iframe
                    src={previewUrl}
                    title={selectedDocument.file_name}
                    className="h-40 w-full rounded-md bg-white"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-center text-sm text-slate-500">
                    Preview not available for this file type.
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-900">
                    {selectedDocument.mime_type || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Size</span>
                  <span className="font-medium text-slate-900">
                    {formatFileSize(selectedDocument.file_size)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 bg-slate-50 px-5 py-4">
              <Button type="button" variant="ghost" onClick={closePreview}>
                Close
              </Button>

              {previewUrl ? (
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  <Button type="button" variant="secondary">
                    Open
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}