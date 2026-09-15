"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { logProgress, type ProgressActionState } from "@/app/actions/progress";

export function ProgressLogForm() {
  const [state, action, pending] = useActionState<ProgressActionState, FormData>(logProgress, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) { formRef.current?.reset(); toast.success(state.success); }
    if (state.error) toast.error(state.error);
  }, [state.error, state.success]);
  return <form ref={formRef} action={action} className="mt-6 space-y-4"><label className="block text-sm font-bold">الوزن بالكيلوغرام<input name="weight_kg" type="number" min="1" step="0.1" required placeholder="مثال: 82.5" dir="ltr" className="field mt-2 text-left" /></label><label className="block text-sm font-bold">صورة التقدم <span className="font-normal text-[var(--text-muted)]">(اختياري)</span><input name="photo" type="file" accept="image/*" className="field mt-2 file:ml-3 file:rounded-sm file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:font-bold file:text-[var(--bg-ink)]" /></label><label className="block text-sm font-bold">ملاحظة <span className="font-normal text-[var(--text-muted)]">(اختياري)</span><textarea name="note" rows={3} placeholder="كيف كان تمرينك اليوم؟" className="field mt-2 resize-none" /></label>{state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}{state.success && <p className="text-sm text-[var(--accent)]" role="status">{state.success}</p>}<button disabled={pending} className="cta-button w-full px-4 py-3.5">{pending ? "جاري الحفظ..." : "حفظ تقدم اليوم"}</button></form>;
}
