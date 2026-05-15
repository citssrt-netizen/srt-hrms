import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

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

function normalizePolicyText(value: unknown) {
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

function employmentTypesConflict(
  firstEmploymentType: string | null,
  secondEmploymentType: string | null
) {
  const first = normalizePolicyText(firstEmploymentType);
  const second = normalizePolicyText(secondEmploymentType);

  if (!first || !second) {
    return true;
  }

  return first === second;
}

async function hasActivePolicyConflict({
  policyId,
  leaveTypeId,
  employmentType,
  minServiceMonths,
  maxServiceMonths,
}: {
  policyId: number;
  leaveTypeId: number;
  employmentType: string | null;
  minServiceMonths: number;
  maxServiceMonths: number | null;
}) {
  const { data: activePolicies, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .select(
      "id, policy_name, employment_type, min_service_months, max_service_months"
    )
    .eq("leave_type_id", leaveTypeId)
    .eq("is_active", true)
    .neq("id", policyId);

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

    const sameEmploymentScope = employmentTypesConflict(
      policy.employment_type,
      employmentType
    );

    const overlappingServiceRange = rangesOverlap(
      policyMinServiceMonths,
      policyMaxServiceMonths,
      minServiceMonths,
      maxServiceMonths
    );

    return sameEmploymentScope && overlappingServiceRange;
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const policyId = Number(id);

  if (!policyId) {
    return NextResponse.json(
      { error: "Invalid policy ID." },
      { status: 400 }
    );
  }

  const body = await request.json();

  const leaveTypeId = cleanNumber(body.leave_type_id);
  const policyName = cleanText(body.policy_name);
  const employmentType = cleanText(body.employment_type);
  const minServiceMonths = cleanNumber(body.min_service_months) ?? 0;
  const maxServiceMonths = cleanNumber(body.max_service_months);
  const entitlementDays = cleanNumber(body.entitlement_days);
  const allowCarryForward = cleanBoolean(body.allow_carry_forward);
  const maxCarryForwardDays = cleanNumber(body.max_carry_forward_days) ?? 0;
  const carryForwardExpiryMonth = cleanNumber(body.carry_forward_expiry_month);
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

  if (maxCarryForwardDays < 0) {
    return NextResponse.json(
      { error: "Maximum carry-forward days cannot be negative." },
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

  if (!allowCarryForward && maxCarryForwardDays > 0) {
    return NextResponse.json(
      {
        error:
          "Maximum carry-forward days can only be set when carry-forward is enabled.",
      },
      { status: 400 }
    );
  }

  if (isActive) {
    try {
      const conflictingPolicy = await hasActivePolicyConflict({
        policyId,
        leaveTypeId,
        employmentType,
        minServiceMonths,
        maxServiceMonths,
      });

      if (conflictingPolicy) {
        return NextResponse.json(
          {
            error: `Policy conflict detected. This policy overlaps with active policy "${conflictingPolicy.policy_name}". Please deactivate the old policy or adjust the service-month range first.`,
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
    .update({
      leave_type_id: leaveTypeId,
      policy_name: policyName,
      employment_type: employmentType,
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
    .eq("id", policyId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ policy: data });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const policyId = Number(id);

  if (!policyId) {
    return NextResponse.json(
      { error: "Invalid policy ID." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("hr_leave_policies")
    .delete()
    .eq("id", policyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}