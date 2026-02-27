"use client";

import { usePathname } from "next/navigation";
import LoginGate from "@/components/dashboard/LoginGate";
import { supabase } from "@/lib/supabase-client";

const NAV_ITEMS = [
  { href: "/dashboard/", label: "Overview" },
  { href: "/dashboard/screenings/", label: "Screenings" },
  { href: "/dashboard/programs/", label: "Programs" },
  { href: "/dashboard/gap/", label: "Gap Analysis" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <LoginGate>
      <div className="no-print mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname === item.href.replace(/\/$/, "");
            return (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-muted hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
      {children}
    </LoginGate>
  );
}
