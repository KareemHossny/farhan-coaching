"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createClientAccount, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

export function CreateClientForm({ defaultValues }: { defaultValues?: { fullName?: string; phone?: string; leadId?: string } }) {
  const [state, action, pending] = useActionState(createClientAccount, initialState);
  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state.error, state.success]);
  return <form action={action} className="mt-6 space-y-4"><label className="block text-sm font-bold">الاسم الكامل<input name="full_name" required defaultValue={defaultValues?.fullName} placeholder="اكتب اسم العميل" className="field mt-2" /></label><label className="block text-sm font-bold">رقم هاتف العميل<input name="phone" type="tel" required defaultValue={defaultValues?.phone} placeholder="01xxxxxxxxx" dir="ltr" className="field mt-2 text-left" /></label><label className="block text-sm font-bold">كلمة المرور المؤقتة<input name="password" type="password" required minLength={6} placeholder="6 أحرف على الأقل" dir="ltr" className="field mt-2 text-left" /></label>{defaultValues?.leadId && <input type="hidden" name="lead_id" value={defaultValues.leadId} />}<label className="block text-sm font-bold">هدف العميل <span className="font-normal text-[var(--text-muted)]">(اختياري)</span><textarea name="goal" placeholder="خسارة وزن، بناء عضل، تحسين اللياقة..." rows={3} className="field mt-2 resize-none" /></label>{state.error && <p className="border border-red-900 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{state.error}</p>}{state.success && <p className="border border-[var(--accent)] bg-[rgb(226,253,75,0.06)] p-3 text-sm text-[var(--accent)]" role="status">{state.success}</p>}<button disabled={pending} className="cta-button w-full px-4 py-3.5">{pending ? "جاري إنشاء الحساب..." : "إنشاء حساب العميل"}</button></form>;
}
