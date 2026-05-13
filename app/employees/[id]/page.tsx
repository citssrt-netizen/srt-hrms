export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EmployeeDocuments } from "./_components/EmployeeDocuments";
import { EmployeeProfilePhoto } from "./_components/EmployeeProfilePhoto";

const PHOTO_BUCKET = "hr-employee-photos";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

async function getEmployee(id: string) {
    const { data, error } = await supabaseAdmin
        .from("hr_employees")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
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

function getStatusBadge(status: unknown) {
    const value = String(status || "Active").toLowerCase();

    if (value === "active") return "bg-emerald-50 text-emerald-700";
    if (value === "inactive") return "bg-slate-100 text-slate-700";
    if (value === "resigned") return "bg-slate-100 text-slate-700";
    if (value === "terminated") return "bg-red-50 text-red-700";
    if (value === "suspended") return "bg-red-50 text-red-700";
    if (value === "on leave") return "bg-amber-50 text-amber-700";

    return "bg-amber-50 text-amber-700";
}

export default async function EmployeeDetailPage({ params }: PageProps) {
    const { id } = await params;
    const employee = await getEmployee(id);

    if (!employee) {
        notFound();
    }

    const profilePhotoUrl = await getProfilePhotoUrl(employee.profile_photo_path);

    return (
        <AppShell title="Employee Profile">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/employees"
                        className="text-sm font-medium text-slate-600 hover:text-slate-950"
                    >
                        ← Back to Employees
                    </Link>

                    <Link href={`/employees/${employee.id}/edit`}>
                        <Button type="button">Edit Employee</Button>
                    </Link>
                </div>

                <EmployeeProfilePhoto
                    employeeId={employee.id}
                    employeeName={employee.full_name}
                    staffNo={employee.staff_no}
                    designation={employee.designation || employee.position}
                    currentPhotoUrl={profilePhotoUrl}
                />

                <div className="flex flex-wrap items-center gap-3">
                    <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            employee.employment_status
                        )}`}
                    >
                        {employee.employment_status || "Active"}
                    </span>

                    <span className="text-sm text-slate-500">
                        Joined {formatDate(employee.joined_date)}
                    </span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard label="Department" value={employee.department} />
                    <SummaryCard label="Branch" value={employee.branch} />
                    <SummaryCard label="Business Unit" value={employee.business_unit} />
                </div>


                <ProfileSection
                    title="Employee Details"
                    description="Core identity and employment information."
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
                        ["Employment Status", employee.employment_status],
                        ["Joined Date", formatDate(employee.joined_date)],
                    ]}
                />

                <ProfileSection
                    title="Contact & Personal"
                    description="Contact, emergency contact, and personal details."
                    items={[
                        ["Mobile No", employee.phone],
                        ["Email", employee.email],
                        ["Emergency Contact Name", employee.emergency_contact_name],
                        ["Emergency Contact No.", employee.emergency_contact_phone],
                        ["Date of Birth", formatDate(employee.date_of_birth)],
                        ["Gender", employee.gender],
                        ["Marital Status", employee.marital_status],
                        ["Nationality", employee.nationality],
                        ["Race", employee.race],
                        ["Religion", employee.religion],
                    ]}
                />

                <ProfileSection
                    title="Address"
                    description="Residential address details."
                    items={[
                        ["Address Line 1", employee.address_line_1],
                        ["Address Line 2", employee.address_line_2],
                        ["Address Line 3", employee.address_line_3],
                        ["Postcode", employee.postcode],
                        ["State", employee.state],
                    ]}
                />

                <EmployeeDocuments employeeId={employee.id} />
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

type ProfileSectionProps = {
    title: string;
    description: string;
    items: [string, unknown][];
};

function ProfileSection({ title, description, items }: ProfileSectionProps) {
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