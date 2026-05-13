import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  type AuthRole,
} from "@/lib/auth/session";

type LoginBody = {
  role?: AuthRole;
  staffNo?: string;
  icNumber?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const role = body.role;
    const staffNo = body.staffNo?.trim();
    const icNumber = body.icNumber?.trim();

    if (role !== "employee" && role !== "employer") {
      return NextResponse.json(
        { error: "Please select a valid login type." },
        { status: 400 }
      );
    }

    if (!staffNo || !icNumber) {
      return NextResponse.json(
        {
          error:
            role === "employee"
              ? "Staff No and IC No are required."
              : "Employer ID and password are required.",
        },
        { status: 400 }
      );
    }

    if (role === "employer") {
      const employerLoginId = process.env.EMPLOYER_LOGIN_ID;
      const employerLoginPassword = process.env.EMPLOYER_LOGIN_PASSWORD;

      if (!employerLoginId || !employerLoginPassword) {
        return NextResponse.json(
          { error: "Employer login is not configured." },
          { status: 500 }
        );
      }

      if (staffNo !== employerLoginId || icNumber !== employerLoginPassword) {
        return NextResponse.json(
          { error: "Invalid Employer ID or password." },
          { status: 401 }
        );
      }

      const token = createSessionToken({
        role: "employer",
        createdAt: new Date().toISOString(),
      });

      const response = NextResponse.json({
        success: true,
        redirectTo: "/dashboard",
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

    const { data: employee, error } = await supabaseAdmin
      .from("hr_employees")
      .select("id, staff_no, ic_number, full_name, employment_status")
      .eq("staff_no", staffNo)
      .eq("ic_number", icNumber)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: "Invalid Staff No or IC No." },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      role: "employee",
      employeeId: employee.id,
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: "/employee-portal",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Failed to login. Please try again." },
      { status: 500 }
    );
  }
}