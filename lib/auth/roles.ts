import type { AuthRole } from "@/lib/auth/session";

export const EMPLOYEE_PORTAL_ROUTES = ["/employee-portal"];
export const EMPLOYER_ROUTES = ["/dashboard", "/employees", "/admin"];

export function isEmployeePortalRoute(pathname: string) {
  return EMPLOYEE_PORTAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isEmployerRoute(pathname: string) {
  return EMPLOYER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function canAccessRoute(role: AuthRole, pathname: string) {
  if (role === "employee") {
    return isEmployeePortalRoute(pathname);
  }

  if (role === "employer") {
    return isEmployerRoute(pathname);
  }

  return false;
}