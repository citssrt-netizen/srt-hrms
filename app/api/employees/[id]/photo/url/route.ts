import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PHOTO_BUCKET = "hr-employee-photos";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  const { data: employee, error } = await supabaseAdmin
    .from("hr_employees")
    .select("id, profile_photo_path")
    .eq("id", id)
    .single();

  if (error || !employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  if (!employee.profile_photo_path) {
    return NextResponse.json({ url: null });
  }

  const { data, error: signedUrlError } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(employee.profile_photo_path, 60 * 60);

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json(
      { error: signedUrlError?.message || "Failed to create photo URL." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}