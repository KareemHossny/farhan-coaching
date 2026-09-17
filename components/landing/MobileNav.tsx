"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = { links: readonly { label: string; href: string }[]; ctaText: string; whatsappNumber: string; ctaMessage: string };

export function MobileNav({ links, ctaText, whatsappNumber, ctaMessage }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <Button variant="ghost" size="sm" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} onClick={() => setOpen((value) => !value)} className="h-10 w-10 p-0 text-white hover:bg-white/10">
        {open ? <X /> : <Menu />}
      </Button>
      {open && <div className="absolute inset-x-0 top-16 max-h-[calc(100svh-4rem)] overflow-y-auto border-b border-[var(--border-hairline)] bg-[var(--bg-ink)] p-4 shadow-2xl sm:p-5"><nav className="flex flex-col gap-2">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-sm px-3 text-base text-[var(--text-secondary)] transition hover:bg-white/5 hover:text-[var(--accent)]">{link.label}</a>)}<a href="/login" onClick={() => setOpen(false)} className="secondary-button mt-2 flex min-h-11 items-center justify-center rounded-sm px-3 text-base font-bold">تسجيل الدخول</a><a className="mt-1" href={whatsappUrl(whatsappNumber, ctaMessage)} target="_blank" rel="noreferrer"><Button className="w-full gap-2 bg-[var(--accent)] font-extrabold text-[var(--bg-ink)] hover:bg-[var(--accent-bright)]"><WhatsAppIcon size={18} />{ctaText}</Button></a></nav></div>}
    </div>
  );
}
