import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  title: string;
  children: ReactNode;
};

export function AppShell({
  title,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1">
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}