import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { recalculateLeaveRequestsForHolidayDate } from "@/lib/leave/recalculateLeaveRequestsForHolidayDate";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
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

  const { data: existingHoliday, error: existingError } = await supabaseAdmin
    .from("hr_public_holidays")
    .select("id, name, holiday_date")
    .eq("id", holidayId)
    .single();

  if (existingError || !existingHoliday) {
    return NextResponse.json(
      { error: "Public holiday not found." },
      { status: 404 }
    );
  }

  const holidayDate = String(existingHoliday.holiday_date || "").split("T")[0];

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

  try {
    await recalculateLeaveRequestsForHolidayDate({
      holidayDate,
      action: "public_holiday_deleted",
      holidayName: existingHoliday.name,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Public holiday was deleted, but affected leave requests could not be recalculated.",
      },
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