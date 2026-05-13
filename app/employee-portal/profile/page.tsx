export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentSession } from "@/lib/auth/session";
import { EmployeeProfilePhoto } from "@/app/employees/[id]/_components/EmployeeProfilePhoto";

const PHOTO_BUCKET = "hr-employee-photos";
const DOCUMENT_BUCKET = "hr-employee-documents";

async function getEmployee(employeeId: number) {
  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .select("*")
    .eq("id", employeeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getDocuments(employeeId: number) {
  const { data, error } = await supabaseAdmin
    .from("hr_employee_documents")
    .select("*")
    .eq("employee_id", employeeId)
    .order("uploaded_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return Promise.all(
    data.map(async (document) => {
      const { data: signedData } = await supabaseAdmin.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(document.file_path, 60 * 10);

      return {
        ...document,
        signedUrl: signedData?.signedUrl || "",
      };
    })
  );
}

async function getProfilePhotoUrl(profilePhotoPath: unknown) {
  if (!profilePhotoPath) {
    return null;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(String(profilePhotoPath), 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

function formatDate(value: unknown) {
  if (!value) return "-";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(size: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default async function EmployeePortalProfilePage() {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee" || !session.employeeId) {
    redirect("/login");
  }

  const employee = await getEmployee(session.employeeId);

  if (!employee) {
    redirect("/login");
  }

  const [profilePhotoUrl, documents] = await Promise.all([
    getProfilePhotoUrl(employee.profile_photo_path),
    getDocuments(employee.id),
  ]);

  return (
    <AppShell title="My Profile">
      <div className="space-y-6">
        <EmployeeProfilePhoto
          employeeId={employee.id}
          employeeName={employee.full_name}
          staffNo={employee.staff_no}
          designation={employee.designation || employee.position}
          currentPhotoUrl={profilePhotoUrl}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Department" value={employee.department} />
          <SummaryCard label="Branch" value={employee.branch} />
          <SummaryCard label="Employment Status" value={employee.employment_status} />
        </div>

        <ProfileSection
          title="Employee Details"
          description="Your core employment information."
          items={[
            ["Staff No", employee.staff_no],
            ["Full Name", employee.full_name],
            ["IC No", employee.ic_number],
            ["Employment Type", employee.employment_type],
            ["Staff Type", employee.staff_type],
            ["Designation", employee.designation],
            ["Department", employee.department],
            ["Division", employee.division],
            ["Branch", employee.branch],
            ["Joined Date", formatDate(employee.joined_date)],
          ]}
        />

        <ProfileSection
          title="Contact & Personal"
          description="Your contact and personal information."
          items={[
            ["Mobile No", employee.phone],
            ["Email", employee.email],
            ["Emergency Contact Name", employee.emergency_contact_name],
            ["Emergency Contact No.", employee.emergency_contact_phone],
            ["Date of Birth", formatDate(employee.date_of_birth)],
            ["Gender", employee.gender],
            ["Marital Status", employee.marital_status],
            ["Nationality", employee.nationality],
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>My Documents</CardTitle>
            <CardDescription>
              View HR documents uploaded to your employee profile.
            </CardDescription>
          </CardHeader>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">File Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No documents uploaded yet.
                    </td>
                  </tr>
                ) : (
                  documents.map((document) => (
                    <tr key={document.id}>
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
                      <td className="px-4 py-3">
                        {document.signedUrl ? (
                          <a
                            href={document.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-950">
        {String(value || "-")}
      </p>
    </div>
  );
}

function ProfileSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: [string, unknown][];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </dt>

            <dd className="mt-1 text-sm font-medium text-slate-950">
              {String(value || "-")}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}