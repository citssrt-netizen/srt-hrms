import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ResolveLeavePolicyParams = {
  employeeId: number;
  leaveTypeId: number;
  year: number;
};

export type ResolvedLeavePolicy = {
  leaveTypeId: number;
  defaultEntitlementDays: number;
  resolvedEntitlementDays: number;
  allowProration: boolean;
  allowCarryForward: boolean;
  maxCarryForwardDays: number;
  carryForwardExpiryMonth: number | null;
  requiresAttachment: boolean;
  policyId: number | null;
  policyName: string | null;
};

function getServiceMonths(joinedDate: string | null, year: number) {
  if (!joinedDate) return 0;

  const joined = new Date(`${joinedDate}T00:00:00`);
  const yearEnd = new Date(`${year}-12-31T00:00:00`);

  if (Number.isNaN(joined.getTime())) {
    return 0;
  }

  if (joined > yearEnd) {
    return 0;
  }

  const months =
    (yearEnd.getFullYear() - joined.getFullYear()) * 12 +
    (yearEnd.getMonth() - joined.getMonth());

  return Math.max(months, 0);
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function policyScopeIdMatches(
  policyValue: unknown,
  employeeValue: unknown
) {
  const policyId = policyValue === null || policyValue === undefined
    ? null
    : Number(policyValue);

  const employeeId = employeeValue === null || employeeValue === undefined
    ? null
    : Number(employeeValue);

  if (!policyId) {
    return true;
  }

  return policyId === employeeId;
}

function policyScopeTextMatches(
  policyValue: unknown,
  employeeValue: unknown
) {
  const policyText = normalizeText(policyValue);
  const employeeText = normalizeText(employeeValue);

  if (!policyText) {
    return true;
  }

  return policyText === employeeText;
}

function policyScopeMatches({
  policyId,
  employeeId,
  policyText,
  employeeText,
}: {
  policyId: unknown;
  employeeId: unknown;
  policyText: unknown;
  employeeText: unknown;
}) {
  if (policyId !== null && policyId !== undefined && String(policyId) !== "") {
    return policyScopeIdMatches(policyId, employeeId);
  }

  return policyScopeTextMatches(policyText, employeeText);
}

export async function resolveLeavePolicy({
  employeeId,
  leaveTypeId,
  year,
}: ResolveLeavePolicyParams): Promise<ResolvedLeavePolicy> {
  const { data: leaveType, error: leaveTypeError } = await supabaseAdmin
    .from("hr_leave_types")
    .select("id, default_days")
    .eq("id", leaveTypeId)
    .single();

  if (leaveTypeError || !leaveType) {
    throw new Error("Leave type not found.");
  }

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from("hr_employees")
    .select(
      `
      joined_date,
      employment_type,
      employment_type_id,
      employment_status,
      employment_status_id,
      branch,
      branch_id,
      department,
      department_id,
      business_unit,
      business_unit_id,
      staff_type,
      staff_type_id
    `
    )
    .eq("id", employeeId)
    .single();

  if (employeeError || !employee) {
    throw new Error("Employee not found.");
  }

  const defaultEntitlementDays = Number(leaveType.default_days || 0);
  const serviceMonths = getServiceMonths(employee.joined_date, year);

  const { data: policies, error: policyError } = await supabaseAdmin
    .from("hr_leave_policies")
    .select("*")
    .eq("leave_type_id", leaveTypeId)
    .eq("is_active", true)
    .order("min_service_months", { ascending: false })
    .order("created_at", { ascending: false });

  if (policyError) {
    throw new Error("Failed to resolve leave policy.");
  }

  const matchedPolicy = (policies || []).find((policy) => {
    const minServiceMonths = Number(policy.min_service_months || 0);

    const maxServiceMonths =
      policy.max_service_months === null ||
      policy.max_service_months === undefined
        ? null
        : Number(policy.max_service_months);

    const minServiceMatches = serviceMonths >= minServiceMonths;

    const maxServiceMatches =
      maxServiceMonths === null || serviceMonths <= maxServiceMonths;

    return (
      policyScopeMatches({
        policyId: policy.employment_type_id,
        employeeId: employee.employment_type_id,
        policyText: policy.employment_type,
        employeeText: employee.employment_type,
      }) &&
      policyScopeMatches({
        policyId: policy.employment_status_id,
        employeeId: employee.employment_status_id,
        policyText: policy.employment_status,
        employeeText: employee.employment_status,
      }) &&
      policyScopeMatches({
        policyId: policy.branch_id,
        employeeId: employee.branch_id,
        policyText: policy.branch,
        employeeText: employee.branch,
      }) &&
      policyScopeMatches({
        policyId: policy.department_id,
        employeeId: employee.department_id,
        policyText: policy.department,
        employeeText: employee.department,
      }) &&
      policyScopeMatches({
        policyId: policy.business_unit_id,
        employeeId: employee.business_unit_id,
        policyText: policy.business_unit,
        employeeText: employee.business_unit,
      }) &&
      policyScopeMatches({
        policyId: policy.staff_type_id,
        employeeId: employee.staff_type_id,
        policyText: policy.staff_type,
        employeeText: employee.staff_type,
      }) &&
      minServiceMatches &&
      maxServiceMatches
    );
  });

  if (!matchedPolicy) {
    return {
      leaveTypeId,
      defaultEntitlementDays,
      resolvedEntitlementDays: defaultEntitlementDays,
      allowProration: true,
      allowCarryForward: false,
      maxCarryForwardDays: 0,
      carryForwardExpiryMonth: null,
      requiresAttachment: false,
      policyId: null,
      policyName: null,
    };
  }

  return {
    leaveTypeId,
    defaultEntitlementDays,
    resolvedEntitlementDays: Number(
      matchedPolicy.entitlement_days || defaultEntitlementDays
    ),
    allowProration: Boolean(matchedPolicy.allow_proration),
    allowCarryForward: Boolean(matchedPolicy.allow_carry_forward),
    maxCarryForwardDays: Number(matchedPolicy.max_carry_forward_days || 0),
    carryForwardExpiryMonth:
      matchedPolicy.carry_forward_expiry_month === null ||
      matchedPolicy.carry_forward_expiry_month === undefined ||
      Number(matchedPolicy.carry_forward_expiry_month) === 0
        ? null
        : Number(matchedPolicy.carry_forward_expiry_month),
    requiresAttachment: Boolean(matchedPolicy.requires_attachment),
    policyId: matchedPolicy.id,
    policyName: matchedPolicy.policy_name,
  };
}