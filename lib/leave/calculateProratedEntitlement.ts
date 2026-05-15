type CalculateProratedEntitlementParams = {
  defaultEntitlementDays: number;
  joinedDate: string | null;
  year: number;
  allowProration?: boolean;
};

function roundToNearestHalfDay(value: number) {
  return Math.round(value * 2) / 2;
}

export function calculateProratedEntitlement({
  defaultEntitlementDays,
  joinedDate,
  year,
  allowProration = true,
}: CalculateProratedEntitlementParams) {
  const entitlementDays = Number(defaultEntitlementDays || 0);

  if (!allowProration || !joinedDate || entitlementDays <= 0) {
    return entitlementDays;
  }

  const joined = new Date(`${joinedDate}T00:00:00`);

  if (Number.isNaN(joined.getTime())) {
    return entitlementDays;
  }

  const yearStart = new Date(`${year}-01-01T00:00:00`);
  const yearEnd = new Date(`${year}-12-31T00:00:00`);

  if (joined <= yearStart) {
    return entitlementDays;
  }

  if (joined > yearEnd) {
    return 0;
  }

  const joinedMonthIndex = joined.getMonth();
  const remainingMonthsIncludingJoinMonth = 12 - joinedMonthIndex;

  const proratedDays =
    entitlementDays * (remainingMonthsIncludingJoinMonth / 12);

  return roundToNearestHalfDay(proratedDays);
}