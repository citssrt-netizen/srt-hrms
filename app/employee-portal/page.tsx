import Link from "next/link";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PHOTO_BUCKET = "hr-employee-photos";

async function getEmployee(employeeId: number) {
    const { data, error } = await supabaseAdmin
        .from("hr_employees")
        .select(
            "id, staff_no, full_name, department, designation, employment_status, joined_date, profile_photo_path"
        )
        .eq("id", employeeId)
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

function formatDate(value: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default async function EmployeePortalPage() {
    const session = await getCurrentSession();

    if (!session || session.role !== "employee" || !session.employeeId) {
        redirect("/login");
    }

    const employee = await getEmployee(session.employeeId);

    if (!employee) {
        redirect("/login");
    }

    const profilePhotoUrl = await getProfilePhotoUrl(
        employee.profile_photo_path
    );

    const initials = String(employee.full_name || "")
        .split(" ")
        .map((word: string) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <AppShell title="Employee Portal">
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                    <div className="flex items-center gap-5">
                        <div
                            className="shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-sm"
                            style={{ width: 112, height: 112 }}
                        >
                            {profilePhotoUrl ? (
                                <img
                                    src={profilePhotoUrl}
                                    alt={employee.full_name}
                                    style={{
                                        width: "112px",
                                        height: "112px",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                                    {initials}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-300">
                                Welcome back,
                            </p>

                            <h2 className="mt-1 text-3xl font-bold tracking-tight">
                                {employee.full_name}
                            </h2>

                            <p className="mt-2 text-sm text-slate-300">
                                {employee.staff_no || "-"} ·{" "}
                                {employee.designation || "-"} ·{" "}
                                {employee.department || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardDescription>Employment Status</CardDescription>
                            <CardTitle>{employee.employment_status || "-"}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardDescription>Department</CardDescription>
                            <CardTitle>{employee.department || "-"}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardDescription>Joined Date</CardDescription>
                            <CardTitle>{formatDate(employee.joined_date)}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardDescription>Self-Service Access</CardDescription>
                            <CardTitle>Active</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <DashboardSummaryCard
                        title="Leave"
                        value="Not configured yet"
                        description="Leave balance and pending requests will appear here once leave management is enabled."
                        actionLabel="Apply Leave"
                        href="/employee-portal/leave"
                    />

                    <DashboardSummaryCard
                        title="Attendance"
                        value="No record today"
                        description="Today’s attendance status, clock-in history, and monthly summaries will appear here."
                        actionLabel="View Attendance"
                        href="/employee-portal/attendance"
                    />

                    <DashboardSummaryCard
                        title="Payroll"
                        value="No payslip available"
                        description="Latest payslip month, salary documents, and payroll notices will appear here."
                        actionLabel="View Payroll"
                        href="/employee-portal/payroll"
                    />

                    <DashboardSummaryCard
                        title="Claims"
                        value="No pending claims"
                        description="Claim submissions, approvals, and reimbursement status will appear here."
                        actionLabel="View Claims"
                        href="/employee-portal/claims"
                    />

                    <DashboardSummaryCard
                        title="Documents"
                        value="Available in profile"
                        description="Employee documents, uploaded HR files, and personal records are currently available in your profile."
                        actionLabel="Open Profile"
                        href="/employee-portal/profile"
                    />

                    <DashboardSummaryCard
                        title="Announcements"
                        value="No new announcements"
                        description="Company notices, HR reminders, and policy updates will appear here."
                        actionLabel="View Announcements"
                        href="/employee-portal"
                    />
                </div>
            </div>
        </AppShell>
    );
}

function DashboardSummaryCard({
    title,
    value,
    description,
    actionLabel,
    href,
}: {
    title: string;
    value: string;
    description: string;
    actionLabel: string;
    href: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{title}</p>

            <h3 className="mt-2 text-xl font-bold text-slate-950">{value}</h3>

            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
                {description}
            </p>

            <div className="mt-5">
                <Link
                    href={href}
                    className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950"
                >
                    {actionLabel}
                </Link>
            </div>
        </div>
    );
}