import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <main className="login-page relative flex min-h-screen items-center overflow-hidden bg-[var(--bg-ink)] px-3 py-4 text-[var(--text-primary)] sm:px-6 sm:py-10">
    <div className="login-background" aria-hidden="true" />
    <div className="login-orb login-orb-one" aria-hidden="true" />
    <div className="login-orb login-orb-two" aria-hidden="true" />
    <div className="login-shell relative mx-auto grid w-full max-w-5xl overflow-hidden">
      <section className="login-visual" aria-label="مساحتك التدريبية">
        <Image src="/images/coach/coach-hero.jpg" alt="كابتن أحمد فرحان" fill priority sizes="(max-width: 1023px) 100vw, 55vw" className="object-cover" />
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <span className="login-kicker"><Sparkles size={15} /> مساحتك الخاصة</span>
          <h2>خطتك. تقدمك.<br />نسختك الأقوى.</h2>
          <p>تابع تمرينك وتغذيتك وسجل تقدمك من مكان واحد، بخطة معمولة على مقاسك.</p>
          <div className="login-trust"><ShieldCheck size={17} /><span>بياناتك خاصة وآمنة</span></div>
        </div>
      </section>
      <section className="login-panel">
        <Link href="/" className="login-back"><ArrowRight size={16} /> العودة للموقع</Link>
        <div className="login-heading">
          <Image src="/images/logo.png" alt="شعار كابتن فرحان" width={150} height={52} className="login-logo" />
          <span className="login-panel-eyebrow">أهلاً بيك</span>
          <h1>سجّل دخولك وابدأ خطوتك</h1>
          <p>ادخل على خطتك وتابع تقدمك بسهولة.</p>
        </div>
        <LoginForm />
      </section>
    </div>
  </main>;
}
