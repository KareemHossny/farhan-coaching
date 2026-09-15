"use client";

import { Activity, Pause, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { removeClientAccount, setClientProgressEnabled, setClientStatus } from "@/app/actions/clients";

export function ClientActions({ clientId, status, progressEnabled }: { clientId: string; status: string; progressEnabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const paused = status === "paused";
  const toggleProgress = () => startTransition(async () => {
    const result = await setClientProgressEnabled(clientId, !progressEnabled);
    if (result.success) { toast.success(result.success); router.refresh(); }
    if (result.error) toast.error(result.error);
  });
  const toggleStatus = () => startTransition(async () => {
    const result = await setClientStatus(clientId, paused ? "active" : "paused");
    if (result.success) { toast.success(result.success); router.refresh(); }
    if (result.error) toast.error(result.error);
  });
  const remove = () => {
    if (!window.confirm("سيتم حذف حساب العميل وخططه وسجل تقدمه نهائيًا. هل تريد المتابعة؟")) return;
    startTransition(async () => {
      const result = await removeClientAccount(clientId);
      if (result.success) { toast.success(result.success); router.refresh(); }
      if (result.error) toast.error(result.error);
    });
  };
  return <div className="flex flex-wrap gap-2"><button type="button" disabled={pending} onClick={toggleStatus} className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-hairline)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50">{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? "تفعيل الحساب" : "إيقاف الحساب"}</button><button type="button" disabled={pending} onClick={toggleProgress} className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-hairline)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"><Activity size={14} />{progressEnabled ? "إيقاف التقدم" : "تفعيل التقدم"}</button><button type="button" disabled={pending} onClick={remove} className="inline-flex items-center gap-1 rounded-sm border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/30 disabled:opacity-50"><Trash2 size={14} />حذف</button></div>;
}
