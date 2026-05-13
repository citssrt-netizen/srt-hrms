import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/requireAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function GET() {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employees: data });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(["employer"]);

  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();

  const fullName = String(body.full_name ?? "").trim();

  if (!fullName) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .insert({
      staff_no: cleanText(body.staff_no),
      employment_type: cleanText(body.employment_type),
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

      business_unit: cleanText(body.business_unit),
      branch: cleanText(body.branch),
      division: cleanText(body.division),
      department: cleanText(body.department),
      employment_status: cleanText(body.employment_status) ?? "Active",
      designation: cleanText(body.designation),
      position: cleanText(body.position),
      staff_type: cleanText(body.staff_type),
      joined_date: cleanText(body.joined_date),
      basic_salary: cleanText(body.basic_salary),
      bank_name: cleanText(body.bank_name),
      bank_account_no: cleanText(body.bank_account_no),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employee: data }, { status: 201 });
}