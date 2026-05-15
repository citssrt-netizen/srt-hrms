import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CalculateCarryForwardParams = {
  employeeId: number;
  leaveTypeId: number;
  year: number;
  allowCarryForward: boolean;
  maxCarryForwardDays: number;
  carryForwardExpiryMonth: number | null;
};

export async function calculateCarryForward({
  employeeId,
  leaveTypeId,
  year,
  allowCarryForward,
  maxCarryForwardDays,
  carryForwardExpiryMonth,
}: CalculateCarryForwardParams) {
  if (!allowCarryForward) {
    return 0;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (
    carryForwardExpiryMonth !== null &&
    year === currentYear &&
    currentMonth > carryForwardExpiryMonth
  ) {
    return 0;
  }

  const previousYear = year - 1;

  const { data: previousBalance, error } = await supabaseAdmin
    .from("hr_employee_leave_balances")
    .select("balance_days")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", previousYear)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to calculate carry-forward leave.");
  }

  const previousUnusedBalance = Math.max(
    Number(previousBalance?.balance_days || 0),
    0
  );

  if (maxCarryForwardDays > 0) {
    return Math.min(previousUnusedBalance, maxCarryForwardDays);
  }

  return previousUnusedBalance;
}