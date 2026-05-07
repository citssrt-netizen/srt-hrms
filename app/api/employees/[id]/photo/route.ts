import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PHOTO_BUCKET = "hr-employee-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;

  const formData = await request.formData();
  const file = formData.get("photo");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Profile photo is required." },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Profile photo must be 5MB or smaller." },
      { status: 400 }
    );
  }

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("hr_employees")
    .select("id, profile_photo_path")
    .eq("id", id)
    .single();

  if (employeeError || !employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const safeFileName = sanitizeFileName(file.name || "profile-photo");
  const filePath = `${id}/${Date.now()}-${safeFileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || "Failed to upload profile photo." },
      { status: 500 }
    );
  }

  const { data: updatedEmployee, error: updateError } = await supabaseAdmin
    .from("hr_employees")
    .update({
      profile_photo_path: filePath,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updatedEmployee) {
    await supabaseAdmin.storage.from(PHOTO_BUCKET).remove([filePath]);

    return NextResponse.json(
      { error: updateError?.message || "Failed to update employee photo." },
      { status: 500 }
    );
  }

  if (employee.profile_photo_path) {
    await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .remove([employee.profile_photo_path]);
  }

  return NextResponse.json({
    employee: updatedEmployee,
    profile_photo_path: filePath,
  });
}