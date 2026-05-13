import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  title: string;
  children: ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950"
            >
              Logout
            </button>
          </form>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}