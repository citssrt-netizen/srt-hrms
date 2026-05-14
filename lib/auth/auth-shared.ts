export type AuthRole = "employee" | "employer";

export type AuthSession = {
  role: AuthRole;
  employeeId?: number;
  createdAt: string;
};

export const SESSION_COOKIE_NAME = "srt_hrms_session";