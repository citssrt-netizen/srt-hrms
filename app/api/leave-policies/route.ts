import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function cleanNumber(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const number = Number(text);

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function cleanExpiryMonth(value: unknown) {
  const number = cleanNumber(value);

  if (number === null || number === 0) {
    return null;
  }

  return number;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function rangesOverlap(
  firstMin: number,
  firstMax: number | null,
  secondMin: number,
  secondMax: number | null
) {
  const firstEnd = firstMax ?? Number.POSITIVE_INFINITY;
  const secondEnd = secondMax ?? Number.POSITIVE_INFINITY;

  return firstMin <= secondEnd && secondMin <= firstEnd;
}

function scopeConflicts(
  existingValue: string | null,
  incomingValue: string | null
) {
  const existing = normalizeText(existingValue);
  const incoming = normalizeText(incomingValue);

  if (!existing || !incoming) {
    return true;
  }

  return existing === incoming;
}

async function hasActivePolicyConflict({
  leaveTypeId,
  employmentType,
  employmentStatus,
  branch,
  department,
  businessUnit,
  staffType,
  minServiceMonths,
  maxServiceMonths,
}: {
  leaveTypeId: number;
  employmentType: string | null;
  employmentStatus: string | null;
  branch: string | null;
  department: string | null;
  businessUnit: string | null;
  staffType: string | null;
  minServiceMonths: number;
  maxServiceMonths: number | null;
}) {
  const { data: activePolicies, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .select("*")
    .eq("leave_type_id", leaveTypeId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Failed to check policy conflicts.");
  }

  return (activePolicies || []).find((policy) => {
    const policyMinServiceMonths = Number(policy.min_service_months || 0);

    const policyMaxServiceMonths =
      policy.max_service_months === null ||
      policy.max_service_months === undefined
        ? null
        : Number(policy.max_service_months);

    const overlappingServiceRange = rangesOverlap(
      policyMinServiceMonths,
      policyMaxServiceMonths,
      minServiceMonths,
      maxServiceMonths
    );

    return (
      overlappingServiceRange &&
      scopeConflicts(policy.employment_type, employmentType) &&
      scopeConflicts(policy.employment_status, employmentStatus) &&
      scopeConflicts(policy.branch, branch) &&
      scopeConflicts(policy.department, department) &&
      scopeConflicts(policy.business_unit, businessUnit) &&
      scopeConflicts(policy.staff_type, staffType)
    );
  });
}

export async function GET() {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  const { data, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .select(
      `
      *,
      hr_leave_types (
        id,
        name,
        code
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ policies: data });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();

  const leaveTypeId = cleanNumber(body.leave_type_id);
  const policyName = cleanText(body.policy_name);

  const employmentType = cleanText(body.employment_type);
  const employmentStatus = cleanText(body.employment_status);
  const branch = cleanText(body.branch);
  const department = cleanText(body.department);
  const businessUnit = cleanText(body.business_unit);
  const staffType = cleanText(body.staff_type);

  const minServiceMonths = cleanNumber(body.min_service_months) ?? 0;
  const maxServiceMonths = cleanNumber(body.max_service_months);

  const entitlementDays = cleanNumber(body.entitlement_days);

  const allowCarryForward = cleanBoolean(body.allow_carry_forward);

  const maxCarryForwardDays =
    cleanNumber(body.max_carry_forward_days) ?? 0;

  const carryForwardExpiryMonth = cleanExpiryMonth(
    body.carry_forward_expiry_month
  );

  const isActive = cleanBoolean(body.is_active);

  if (!leaveTypeId) {
    return NextResponse.json(
      { error: "Leave type is required." },
      { status: 400 }
    );
  }

  if (!policyName) {
    return NextResponse.json(
      { error: "Policy name is required." },
      { status: 400 }
    );
  }

  if (entitlementDays === null) {
    return NextResponse.json(
      { error: "Entitlement days is required." },
      { status: 400 }
    );
  }

  if (entitlementDays < 0) {
    return NextResponse.json(
      { error: "Entitlement days cannot be negative." },
      { status: 400 }
    );
  }

  if (minServiceMonths < 0) {
    return NextResponse.json(
      { error: "Minimum service months cannot be negative." },
      { status: 400 }
    );
  }

  if (maxServiceMonths !== null && maxServiceMonths < minServiceMonths) {
    return NextResponse.json(
      {
        error:
          "Maximum service months must be greater than or equal to minimum service months.",
      },
      { status: 400 }
    );
  }

  if (
    carryForwardExpiryMonth !== null &&
    (carryForwardExpiryMonth < 1 || carryForwardExpiryMonth > 12)
  ) {
    return NextResponse.json(
      { error: "Carry-forward expiry month must be between 1 and 12." },
      { status: 400 }
    );
  }

  if (isActive) {
    try {
      const conflictingPolicy = await hasActivePolicyConflict({
        leaveTypeId,
        employmentType,
        employmentStatus,
        branch,
        department,
        businessUnit,
        staffType,
        minServiceMonths,
        maxServiceMonths,
      });

      if (conflictingPolicy) {
        return NextResponse.json(
          {
            error:
              "Policy conflict detected. Another active policy already targets the same employee scope.",
          },
          { status: 409 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to check policy conflicts." },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .insert({
      leave_type_id: leaveTypeId,
      policy_name: policyName,

      employment_type: employmentType,
      employment_status: employmentStatus,
      branch,
      department,
      business_unit: businessUnit,
      staff_type: staffType,

      min_service_months: minServiceMonths,
      max_service_months: maxServiceMonths,

      entitlement_days: entitlementDays,

      allow_proration: cleanBoolean(body.allow_proration),

      allow_carry_forward: allowCarryForward,

      max_carry_forward_days: maxCarryForwardDays,

      carry_forward_expiry_month: carryForwardExpiryMonth,

      requires_attachment: cleanBoolean(body.requires_attachment),

      is_active: isActive,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ policy: data }, { status: 201 });
}