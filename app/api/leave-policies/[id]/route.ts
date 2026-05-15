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
  const entitlementDays = cleanNumber(body.entitlement_days);

  if (!leaveTypeId || !policyName || entitlementDays === null) {
    return NextResponse.json(
      { error: "Leave type, policy name, and entitlement days are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .update({
      leave_type_id: leaveTypeId,
      policy_name: policyName,
      employment_type: cleanText(body.employment_type),
      min_service_months: cleanNumber(body.min_service_months) ?? 0,
      max_service_months: cleanNumber(body.max_service_months),
      entitlement_days: entitlementDays,
      allow_proration: cleanBoolean(body.allow_proration),
      allow_carry_forward: cleanBoolean(body.allow_carry_forward),
      max_carry_forward_days: cleanNumber(body.max_carry_forward_days) ?? 0,
      carry_forward_expiry_month: cleanNumber(body.carry_forward_expiry_month),
      requires_attachment: cleanBoolean(body.requires_attachment),
      is_active: cleanBoolean(body.is_active),
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