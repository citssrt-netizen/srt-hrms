import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { response } = await requireApiAuth(["employer"]);

  if (response) {
    return response;
  }

  const { id } = await context.params;

  const holidayId = Number(id);

  if (!holidayId) {
    return NextResponse.json(
      { error: "Invalid public holiday ID." },
      { status: 400 }
    );
  }

  const { data: existingHoliday, error: existingError } =
    await supabaseAdmin
      .from("hr_public_holidays")
      .select("id, name")
      .eq("id", holidayId)
      .single();

  if (existingError || !existingHoliday) {
    return NextResponse.json(
      { error: "Public holiday not found." },
      { status: 404 }
    );
  }

  const { error } = await supabaseAdmin
    .from("hr_public_holidays")
    .delete()
    .eq("id", holidayId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete public holiday." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 }
  );
}