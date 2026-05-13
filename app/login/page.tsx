"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type LoginRole = "employee" | "employer";

export default function LoginPage() {
  const [role, setRole] = useState<LoginRole>("employee");
  const [staffNo, setStaffNo] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          staffNo,
          icNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to login.");
      }

      window.location.href =
        result.redirectTo || (role === "employer" ? "/dashboard" : "/employee-portal");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_440px]">
        <div>
          <div className="mb-6 inline-flex items-center rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-sm text-slate-300">
            SRT Security Services
          </div>

          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            Sign in to SRT HRMS
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            One secure entry point for HR administration and employee
            self-service access.
          </p>
        </div>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-950">Login</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select your access type to continue.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setRole("employee");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                role === "employee"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Employee
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("employer");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                role === "employer"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Employer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="staff-no">
                {role === "employee" ? "Staff No" : "Employer ID"}
              </Label>
              <Input
                id="staff-no"
                value={staffNo}
                onChange={(event) => setStaffNo(event.target.value)}
                placeholder={
                  role === "employee" ? "Example: SRT001" : "Enter employer ID"
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ic-number">
                {role === "employee" ? "IC No" : "Password"}
              </Label>
              <Input
                id="ic-number"
                type={role === "employee" ? "text" : "password"}
                value={icNumber}
                onChange={(event) => setIcNumber(event.target.value)}
                placeholder={
                  role === "employee"
                    ? "Enter employee IC number"
                    : "Enter employer password"
                }
              />
            </div>

            {message ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {message}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}