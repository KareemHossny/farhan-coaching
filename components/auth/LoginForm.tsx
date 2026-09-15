"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn, type AuthActionState } from "@/app/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, {} as AuthActionState);
  useEffect(() => {
    if (state.success === "coach") { toast.success("تم تسجيل الدخول بنجاح"); router.replace("/coach"); }
    if (state.success === "client") { toast.success("تم تسجيل الدخول بنجاح"); router.replace("/dashboard"); }
    if (state.error) toast.error(state.error);
  }, [router, state.error, state.success]);
  return <form action={action} className="space-y-5"><label className="block text-sm font-bold">البريد الإلكتروني<input name="email" type="email" required autoComplete="email" dir="ltr" className="field mt-2 text-left" /></label><label className="block text-sm font-bold">كلمة المرور<input name="password" type="password" required autoComplete="current-password" dir="ltr" className="field mt-2 text-left" /></label>{state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}<button disabled={pending} className="cta-button w-full px-4 py-3.5">{pending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</button></form>;
}
