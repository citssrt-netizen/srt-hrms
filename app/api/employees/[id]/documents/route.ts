import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const BUCKET_NAME = "hr-employee-documents";

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("hr_employee_documents")
    .select("id, employee_id, file_name, file_path, file_size, mime_type, uploaded_at")
    .eq("employee_id", id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Document file is required" },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "Document file is empty" },
      { status: 400 }
    );
  }

  const safeFileName = sanitizeFileName(file.name);

  if (!safeFileName) {
    return NextResponse.json(
      { error: "Invalid file name" },
      { status: 400 }
    );
  }

  const filePath = `employees/${id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data, error: insertError } = await supabaseAdmin
    .from("hr_employee_documents")
    .insert({
      employee_id: id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || null,
    })
    .select("id, employee_id, file_name, file_path, file_size, mime_type, uploaded_at")
    .single();

  if (insertError) {
    await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);

    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ document: data }, { status: 201 });
}