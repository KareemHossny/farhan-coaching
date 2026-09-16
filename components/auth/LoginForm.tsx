"use client";

import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn, type AuthActionState } from "@/app/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, {} as AuthActionState);

  useEffect(() => {
    if (state.success === "coach") {
      toast.success("تم تسجيل الدخول بنجاح");
      router.replace("/coach");
    }
    if (state.success === "client") {
      toast.success("تم تسجيل الدخول بنجاح");
      router.replace("/dashboard");
    }
    if (state.error) toast.error(state.error);
  }, [router, state.error, state.success]);

  return <form action={action} className="login-form" noValidate={false}>
    <label className="login-field-label">
      <span>البريد الإلكتروني</span>
      <span className="login-field-control"><Mail size={17} aria-hidden="true" /><input name="email" type="email" required autoComplete="email" dir="ltr" placeholder="name@example.com" /></span>
    </label>
    <label className="login-field-label">
      <span>كلمة المرور</span>
      <span className="login-field-control"><LockKeyhole size={17} aria-hidden="true" /><input name="password" type="password" required autoComplete="current-password" dir="ltr" placeholder="••••••••" /></span>
    </label>
    {state.error && <p className="login-error" role="alert">{state.error}</p>}
    <button type="submit" disabled={pending} className="cta-button login-submit">
      <span>{pending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</span>
      {!pending && <ArrowLeft size={17} aria-hidden="true" />}
    </button>
    <p className="login-help">لو واجهتك مشكلة في الدخول، تواصل مع الكابتن مباشرة.</p>
  </form>;
}
