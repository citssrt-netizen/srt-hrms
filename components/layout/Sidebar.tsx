"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Employees",
    href: "/employees",
  },
  {
    label: "Leave",
    href: "/leave",
  },
  {
    label: "Payroll",
    href: "/payroll",
  },
  {
    label: "Documents",
    href: "/documents",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col border-r border-slate-200 bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight">
          SRT HRMS
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Human Resource System
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}