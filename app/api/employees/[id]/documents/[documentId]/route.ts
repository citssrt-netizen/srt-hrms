import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteProps = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

const BUCKET_NAME = "hr-employee-documents";

export async function GET(
  _request: Request,
  { params }: RouteProps
) {
  const { id, documentId } = await params;

  const { data: document, error } = await supabaseAdmin
    .from("hr_employee_documents")
    .select("*")
    .eq("id", documentId)
    .eq("employee_id", id)
    .single();

  if (error || !document) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  const { data, error: signedUrlError } =
    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(document.file_path, 60 * 10);

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate preview URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: data.signedUrl,
  });
}