import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
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
    .update({
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
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employee: data });
}