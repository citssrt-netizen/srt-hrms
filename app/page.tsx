import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-sm text-slate-300">
            SRT Security Services
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            SRT HRMS 
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            Modern Human Resource Management System for workforce,
            payroll, leave management, employee records, and HR operations.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button>
                Login
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="secondary">
                Preview Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}