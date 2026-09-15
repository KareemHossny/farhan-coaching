"use client";

import Link from "next/link";
import { LayoutDashboard, Library, MessageSquare, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/coach/LogoutButton";

const links = [
  { href: "/coach", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/coach/clients", label: "العملاء", icon: Users },
  { href: "/coach/leads", label: "الطلبات", icon: MessageSquare },
  { href: "/coach/library", label: "المكتبة", icon: Library },
];

export function CoachHeader({ name }: { name?: string | null }) {
  const pathname = usePathname();

  return <header className="coach-header mb-8 border-b border-[var(--border-hairline)] pb-5"><div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><p className="eyebrow">لوحة المدرب</p><h1 className="mt-2 text-2xl font-black">أهلًا {name ?? "يا كابتن"}</h1><p className="mt-1 text-sm text-[var(--text-muted)]">إدارة العملاء والخطط من مكان واحد.</p></div><div className="flex flex-col gap-3 xl:items-end"><nav className="coach-nav flex w-full gap-1 overflow-x-auto border border-[var(--border-hairline)] bg-[var(--surface)] p-1" aria-label="تنقل لوحة المدرب">{links.map(({ href, label, icon: Icon }) => { const active = href === "/coach" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`coach-nav-link whitespace-nowrap ${active ? "coach-nav-link-active" : ""}`} aria-current={active ? "page" : undefined}><Icon size={15} />{label}</Link>; })}</nav><div className="flex w-full justify-end"><LogoutButton /></div></div></div></header>;
}
