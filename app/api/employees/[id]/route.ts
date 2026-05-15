import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const MASTER_DATA_FIELDS = {
  employment_type_id: "employment_type",
  employment_status_id: "employment_status",
  business_unit_id: "business_unit",
  branch_id: "branch",
  division_id: "division",
  department_id: "department",
  staff_type_id: "staff_type",
  designation_id: "designation",
} as const;

type MasterDataIdField = keyof typeof MASTER_DATA_FIELDS;

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function cleanNumber(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) return null;

  const number = Number(text);

  if (!Number.isInteger(number) || number <= 0) return null;

  return number;
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

export async function PATCH(request: Request, { params }: RouteProps) {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const employeeId = Number(id);

  if (!employeeId) {
    return NextResponse.json(
      { error: "Invalid employee ID." },
      { status: 400 }
    );
  }

  const body = await request.json();

  if (body.action === "update-status") {
    const employmentStatusId = cleanNumber(body.employment_status_id);

    if (!employmentStatusId) {
      return NextResponse.json(
        { error: "Employment status is required." },
        { status: 400 }
      );
    }

    try {
      const resolved = await resolveMasterDataText(
        "employment_status_id",
        employmentStatusId
      );

      const { data, error } = await supabaseAdmin
        .from("hr_employees")
        .update({
          employment_status_id: resolved.id,
          employment_status: resolved.name,
        })
        .eq("id", employeeId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ employee: data });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid employee status.",
        },
        { status: 400 }
      );
    }
  }

  const fullName = String(body.full_name ?? "").trim();

  if (!fullName) {
    return NextResponse.json(
      { error: "Full name is required" },
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
            : "Invalid employee master data value.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .update({
      staff_no: cleanText(body.staff_no),
      ...masterDataPayload,
      full_name: fullName,
      date_of_birth: cleanText(body.date_of_birth),
      gender: cleanText(body.gender),
      marital_status: cleanText(body.marital_status),
      ic_number: cleanText(body.ic_number),
      race: cleanText(body.race),
      religion: cleanText(body.religion),
      nationality: cleanText(body.nationality),

      address_line_1: cleanText(body.address_line_1),
      address_line_2: cleanText(body.address_line_2),
      address_line_3: cleanText(body.address_line_3),
      postcode: cleanText(body.postcode),
      state: cleanText(body.state),
      email: cleanText(body.email),
      phone: cleanText(body.phone),
      emergency_contact_name: cleanText(body.emergency_contact_name),
      emergency_contact_phone: cleanText(body.emergency_contact_phone),
      address: cleanText(body.address),

      position: cleanText(body.position),
      joined_date: cleanText(body.joined_date),
      basic_salary: cleanText(body.basic_salary),
      bank_name: cleanText(body.bank_name),
      bank_account_no: cleanText(body.bank_account_no),
    })
    .eq("id", employeeId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employee: data });
}