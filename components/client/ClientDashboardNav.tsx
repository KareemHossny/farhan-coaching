"use client";

import { Activity, Dumbbell, House, Trophy, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

const links = [
  { href: "/dashboard", label: "نظرة عامة", icon: House, exact: true },
  { href: "/dashboard/exercises", label: "التمارين", icon: Dumbbell, exact: false },
  { href: "/dashboard/meals", label: "الوجبات", icon: Utensils, exact: false },
  { href: "/dashboard/strength", label: "الأوزان والعدات", icon: Trophy, exact: false },
  { href: "/dashboard/progress", label: "التقدم والوزن", icon: Activity, exact: false },
] as const;

function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام لوحة العميل" className={compact ? "flex min-w-max gap-2" : "space-y-1"}>
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={compact ? `client-mobile-nav-link ${active ? "client-mobile-nav-link-active" : ""}` : `client-sidebar-link ${active ? "client-sidebar-link-active" : ""}`}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ClientDashboardNav({ name, children }: { name: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-ink)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[rgb(15_15_17_/_0.96)] px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="eyebrow">لوحة العميل</p><h1 className="truncate text-base font-black">أهلًا {name ?? "بك"}</h1></div>
          <LogoutButton />
        </div>
        <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1"><NavLinks compact /></div>
      </header>

      <div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-l border-[var(--border-hairline)] bg-[var(--surface-quiet)] p-5 lg:flex lg:flex-col">
          <div className="border-b border-[var(--border-hairline)] pb-6"><p className="eyebrow">لوحة العميل</p><h1 className="mt-2 text-xl font-black">أهلًا {name ?? "بك"}</h1><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">كل ما تحتاجه لتمرينك ومتابعتك في مكان واضح.</p></div>
          <div className="mt-6"><NavLinks /></div>
          <div className="mt-auto border-t border-[var(--border-hairline)] pt-5"><LogoutButton /></div>
        </aside>
        <main className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
