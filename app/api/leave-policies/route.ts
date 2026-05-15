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
  const entitlementDays = cleanNumber(body.entitlement_days);

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

  const { data, error } = await supabaseAdmin
    .from("hr_leave_policies")
    .insert({
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
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ policy: data }, { status: 201 });
}