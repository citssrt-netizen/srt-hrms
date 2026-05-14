import { supabaseAdmin } from "@/lib/supabaseAdmin";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value: string | null) {
  if (!value) return "";

  return value.split("T")[0];
}

export async function calculateLeaveWorkingDays({
  startDateValue,
  endDateValue,
  isHalfDay,
}: {
  startDateValue: string;
  endDateValue: string;
  isHalfDay: boolean;
}) {
  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  const { data: publicHolidays, error: holidayError } = await supabaseAdmin
    .from("hr_public_holidays")
    .select("holiday_date")
    .gte("holiday_date", startDateValue)
    .lte("holiday_date", endDateValue);

  if (holidayError) {
    throw new Error("Failed to load public holidays.");
  }

  const holidaySet = new Set(
    (publicHolidays || []).map((holiday) =>
      normalizeDateKey(String(holiday.holiday_date || ""))
    )
  );

  if (isHalfDay) {
    const dayOfWeek = startDate.getDay();
    const formattedDate = formatDateKey(startDate);

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPublicHoliday = holidaySet.has(formattedDate);

    return isWeekend || isPublicHoliday ? 0 : 0.5;
  }

  let totalDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const formattedDate = formatDateKey(currentDate);

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPublicHoliday = holidaySet.has(formattedDate);

    if (!isWeekend && !isPublicHoliday) {
      totalDays += 1;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalDays;
}