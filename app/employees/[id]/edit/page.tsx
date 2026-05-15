import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EmployeeDocuments } from "../_components/EmployeeDocuments";
import { EmployeeProfilePhoto } from "../_components/EmployeeProfilePhoto";
import { EmployeeForm } from "../../_components/EmployeeForm";

const PHOTO_BUCKET = "hr-employee-photos";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MasterDataItem = {
  id: number;
  category: string;
  name: string;
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

async function getMasterData(): Promise<MasterDataItem[]> {
  const { data, error } = await supabaseAdmin
    .from("hr_master_data_items")
    .select("id, category, name")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load HR master data:", error);
    throw new Error(`Failed to load HR master data: ${error.message}`);
  }

  return data ?? [];
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

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;

  const [employee, masterData] = await Promise.all([
    getEmployee(id),
    getMasterData(),
  ]);

  if (!employee) {
    notFound();
  }

  const profilePhotoUrl = await getProfilePhotoUrl(employee.profile_photo_path);

  return (
    <AppShell title="Edit Employee">
      <div className="space-y-6">
        <Link
          href={`/employees/${employee.id}`}
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Back to Employee Profile
        </Link>

        <EmployeeProfilePhoto
          employeeId={employee.id}
          employeeName={employee.full_name}
          staffNo={employee.staff_no}
          designation={employee.designation || employee.position}
          currentPhotoUrl={profilePhotoUrl}
          showUpload
        />

        <Card>
          <CardHeader>
            <CardTitle>Edit Employee</CardTitle>
            <CardDescription>
              Update employee profile and HR information.
            </CardDescription>
          </CardHeader>

          <EmployeeForm
            mode="edit"
            employeeId={employee.id}
            initialData={employee}
            masterData={masterData}
          />
        </Card>

        <EmployeeDocuments employeeId={employee.id} showUpload />
      </div>
    </AppShell>
  );
}