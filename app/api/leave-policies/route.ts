import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { recalculateEmployeeLeaveBalance } from "@/lib/leave/recalculateEmployeeLeaveBalance";

const MASTER_DATA_FIELDS = {
  employment_type_id: "employment_type",
  employment_status_id: "employment_status",
  branch_id: "branch",
  department_id: "department",
  business_unit_id: "business_unit",
  staff_type_id: "staff_type",
} as const;

type MasterDataIdField = keyof typeof MASTER_DATA_FIELDS;

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
  existingValue: number | null,
  incomingValue: number | null
) {
  if (!existingValue || !incomingValue) {
    return true;
  }

  return existingValue === incomingValue;
}

async function resolveMasterDataText(
  field: MasterDataIdField,
  value: unknown
) {
  const id = cleanNumber(value);

  if (!id) {
    return {
      id: null,
      name: null,
    };
  }

  const category = MASTER_DATA_FIELDS[field];

  const { data, error } = await supabaseAdmin
    .from("hr_master_data_items")
    .select("id, name")
    .eq("id", id)
    .eq("category", category)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error(`Invalid master data value for ${category}.`);
  }

  return {
    id: data.id,
    name: data.name,
  };
}

async function buildMasterDataPayload(body: Record<string, unknown>) {
  const entries = await Promise.all(
    Object.keys(MASTER_DATA_FIELDS).map(async (field) => {
      const key = field as MasterDataIdField;
      const textField = MASTER_DATA_FIELDS[key];

      const resolved = await resolveMasterDataText(key, body[key]);

      return [
        [key, resolved.id],
        [textField, resolved.name],
      ];
    })
  );

  return Object.fromEntries(entries.flat());
}

async function hasActivePolicyConflict({
  leaveTypeId,
  employmentTypeId,
  employmentStatusId,
  branchId,
  departmentId,
  businessUnitId,
  staffTypeId,
  minServiceMonths,
  maxServiceMonths,
}: {
  leaveTypeId: number;
  employmentTypeId: number | null;
  employmentStatusId: number | null;
  branchId: number | null;
  departmentId: number | null;
  businessUnitId: number | null;
  staffTypeId: number | null;
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
      scopeConflicts(
        policy.employment_type_id,
        employmentTypeId
      ) &&
      scopeConflicts(
        policy.employment_status_id,
        employmentStatusId
      ) &&
      scopeConflicts(policy.branch_id, branchId) &&
      scopeConflicts(policy.department_id, departmentId) &&
      scopeConflicts(
        policy.business_unit_id,
        businessUnitId
      ) &&
      scopeConflicts(policy.staff_type_id, staffTypeId)
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

  const minServiceMonths =
    cleanNumber(body.min_service_months) ?? 0;

  const maxServiceMonths = cleanNumber(
    body.max_service_months
  );

  const entitlementDays = cleanNumber(
    body.entitlement_days
  );

  const allowCarryForward = cleanBoolean(
    body.allow_carry_forward
  );

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

  if (
    maxServiceMonths !== null &&
    maxServiceMonths < minServiceMonths
  ) {
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
    (carryForwardExpiryMonth < 1 ||
      carryForwardExpiryMonth > 12)
  ) {
    return NextResponse.json(
      {
        error:
          "Carry-forward expiry month must be between 1 and 12.",
      },
      { status: 400 }
    );
  }

  let masterDataPayload;

  try {
    masterDataPayload = await buildMasterDataPayload(body);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid master data value.",
      },
      { status: 400 }
    );
  }

  if (isActive) {
    try {
      const conflictingPolicy =
        await hasActivePolicyConflict({
          leaveTypeId,
          employmentTypeId:
            masterDataPayload.employment_type_id,
          employmentStatusId:
            masterDataPayload.employment_status_id,
          branchId: masterDataPayload.branch_id,
          departmentId: masterDataPayload.department_id,
          businessUnitId:
            masterDataPayload.business_unit_id,
          staffTypeId:
            masterDataPayload.staff_type_id,
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
        {
          error:
            "Failed to check policy conflicts.",
        },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .insert({
      leave_type_id: leaveTypeId,
      policy_name: policyName,

      ...masterDataPayload,

      min_service_months: minServiceMonths,
      max_service_months: maxServiceMonths,

      entitlement_days: entitlementDays,

      allow_proration: cleanBoolean(
        body.allow_proration
      ),

      allow_carry_forward: allowCarryForward,

      max_carry_forward_days:
        maxCarryForwardDays,

      carry_forward_expiry_month:
        carryForwardExpiryMonth,

      requires_attachment: cleanBoolean(
        body.requires_attachment
      ),

      is_active: isActive,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const currentYear = new Date().getFullYear();

  try {
    const { data: employees, error: employeesError } =
      await supabaseAdmin
        .from("hr_employees")
        .select("id")
        .eq("employment_status", "Active");

    if (employeesError) {
      throw employeesError;
    }

    for (const employee of employees || []) {
      await recalculateEmployeeLeaveBalance({
        employeeId: employee.id,
        leaveTypeId,
        year: currentYear,
      });
    }
  } catch (recalculateError) {
    console.error(
      "Leave policy saved but balance recalculation failed:",
      recalculateError
    );

    return NextResponse.json(
      {
        policy: data,
        warning:
          "Leave policy saved, but automatic balance recalculation failed. Please run manual recalculation.",
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { policy: data },
    { status: 201 }
  );
}