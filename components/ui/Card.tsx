import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="mb-5 space-y-1">{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-slate-950">{children}</h2>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}