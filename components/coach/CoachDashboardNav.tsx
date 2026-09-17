"use client";

import { BookOpen, LayoutDashboard, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/coach/LogoutButton";

const links = [
  { href: "/coach", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/coach/clients", label: "العملاء", icon: Users, exact: false },
  { href: "/coach/leads", label: "الطلبات", icon: MessageSquare, exact: false },
  { href: "/coach/library", label: "المكتبة", icon: BookOpen, exact: false },
] as const;

function Links({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return <nav className={compact ? "flex min-w-max gap-2" : "space-y-1"} aria-label="أقسام لوحة المدرب">{links.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={compact ? `client-mobile-nav-link ${active ? "client-mobile-nav-link-active" : ""}` : `client-sidebar-link ${active ? "client-sidebar-link-active" : ""}`}><Icon size={18} /><span>{label}</span></Link>; })}</nav>;
}

export function CoachDashboardNav({ name, children }: { name: string | null; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--bg-ink)] text-[var(--text-primary)]"><header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[rgb(15_15_17_/_0.96)] px-4 py-3 backdrop-blur lg:hidden"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="eyebrow">لوحة المدرب</p><h1 className="truncate text-base font-black">أهلًا {name ?? "يا كابتن"}</h1></div><LogoutButton /></div><div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1"><Links compact /></div></header><div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]"><aside className="sticky top-0 hidden h-screen border-l border-[var(--border-hairline)] bg-[var(--surface-quiet)] p-5 lg:flex lg:flex-col"><div className="border-b border-[var(--border-hairline)] pb-6"><p className="eyebrow">لوحة المدرب</p><h1 className="mt-2 text-xl font-black">أهلًا {name ?? "يا كابتن"}</h1><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">إدارة العملاء والخطط من مكان واحد.</p></div><div className="mt-6"><Links /></div><div className="mt-auto border-t border-[var(--border-hairline)] pt-5"><LogoutButton /></div></aside><main className="min-w-0">{children}</main></div></div>;
}
