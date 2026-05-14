import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { recalculateLeaveRequestsForHolidayDate } from "@/lib/leave/recalculateLeaveRequestsForHolidayDate";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isValidDate(value: unknown) {
  if (typeof value !== "string" || !value) return false;

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

export async function POST(request: Request) {
  const { response } = await requireApiAuth(["employer"]);

  if (response) {
    return response;
  }

  const body = await request.json();

  const holidayDate = String(body.holiday_date || "");
  const name = String(body.name || "").trim();
  const state = String(body.state || "").trim();
  const isNational = Boolean(body.is_national);

  if (!isValidDate(holidayDate)) {
    return NextResponse.json(
      { error: "Please select a valid holiday date." },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: "Please enter the holiday name." },
      { status: 400 }
    );
  }

  const { data: existingHoliday, error: existingError } = await supabaseAdmin
    .from("hr_public_holidays")
    .select("id")
    .eq("holiday_date", holidayDate)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "Failed to check existing public holiday." },
      { status: 500 }
    );
  }

  if (existingHoliday) {
    return NextResponse.json(
      { error: "A public holiday already exists for this date." },
      { status: 400 }
    );
  }

  const { data: publicHoliday, error } = await supabaseAdmin
    .from("hr_public_holidays")
    .insert({
      holiday_date: holidayDate,
      name,
      state: state || null,
      is_national: isNational,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create public holiday." },
      { status: 500 }
    );
  }

  try {
    await recalculateLeaveRequestsForHolidayDate({
      holidayDate,
      action: "public_holiday_created",
      holidayName: name,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Public holiday was created, but affected leave requests could not be recalculated.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicHoliday }, { status: 201 });
}