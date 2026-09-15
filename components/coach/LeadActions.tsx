"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markLeadContacted } from "@/app/actions/leads";

export function LeadActions({ leadId, leadName, leadPhone }: { leadId: string; leadName: string; leadPhone: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const handleContacted = () => startTransition(async () => {
    const result = await markLeadContacted(leadId);
    if (result.success) { toast.success(result.success); router.refresh(); }
    if (result.error) toast.error(result.error);
  });
  return <div className="flex shrink-0 flex-wrap gap-2"><Link href={`/coach/clients?leadId=${encodeURIComponent(leadId)}&leadName=${encodeURIComponent(leadName)}&leadPhone=${encodeURIComponent(leadPhone)}#new-client`} className="secondary-button rounded-sm px-3 py-2 text-sm font-bold">تحويل لعميل</Link><button type="button" disabled={pending} onClick={handleContacted} className="rounded-sm border border-[var(--border-hairline)] px-3 py-2 text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50">{pending ? "جاري الحفظ..." : "تم التواصل"}</button></div>;
}
