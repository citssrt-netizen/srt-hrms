import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentSession, type AuthRole } from "@/lib/auth/session";

export async function requirePageAuth(allowedRoles: AuthRole[]) {
  const session = await getCurrentSession();

  if (!session || !allowedRoles.includes(session.role)) {
    redirect("/login");
  }

  return session;
}

export async function requireApiAuth(allowedRoles: AuthRole[]) {
  const session = await getCurrentSession();

  if (!session || !allowedRoles.includes(session.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return {
    session,
    response: null,
  };
}