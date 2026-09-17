"use client";

export function CoachHeader({ name }: { name?: string | null }) {
  return <header className="coach-header mb-8 border-b border-[var(--border-hairline)] pb-5"><p className="eyebrow">لوحة المدرب</p><h1 className="mt-2 text-2xl font-black">أهلًا {name ?? "يا كابتن"}</h1><p className="mt-1 text-sm text-[var(--text-muted)]">إدارة العملاء والخطط من مكان واحد.</p></header>;
}
