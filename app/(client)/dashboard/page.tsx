import { Activity, ArrowLeft, Dumbbell, Scale, Trophy, Utensils } from "lucide-react";
import Link from "next/link";
import { getClientDashboardSession } from "@/lib/client-dashboard";

const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const destinationCards = [
  { href: "/dashboard/exercises", title: "تمارينك", description: "شاهد تمرين اليوم وفيديوهات التنفيذ.", icon: Dumbbell },
  { href: "/dashboard/meals", title: "وجباتك", description: "خطة غذائية منظمة بالجرامات فقط.", icon: Utensils },
  { href: "/dashboard/strength", title: "الأوزان والعدات", description: "حدّث أقصى أداء حققته في كل تمرين.", icon: Trophy },
  { href: "/dashboard/progress", title: "تقدمك", description: "سجل وزنك وصورك وتابع رحلتك.", icon: Activity },
] as const;

export default async function ClientDashboardPage() {
  const { supabase, user, account } = await getClientDashboardSession();
  const { data: progress } = await supabase.from("progress_logs").select("weight_kg").eq("client_id", user.id).order("date", { ascending: false }).limit(1);
  const latestWeight = progress?.[0]?.weight_kg;
  const today = new Date().getDay();

  return <div className="mx-auto max-w-5xl"><section className="client-welcome panel p-5 sm:p-7"><p className="eyebrow">مساحتك التدريبية</p><h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">جاهز لخطوة النهارده؟</h2><p className="mt-3 max-w-2xl leading-7 text-[var(--text-muted)]">اختار القسم الذي تحتاجه الآن، وكل بيانات تمرينك ومتابعتك مرتبة في مكانها.</p><div className="mt-6 grid grid-cols-2 gap-2 sm:max-w-md"><div className="client-summary-tile"><Activity size={17} /><span>اليوم</span><strong>{dayNames[today]}</strong></div><div className="client-summary-tile"><Scale size={17} /><span>آخر وزن</span><strong>{latestWeight ? `${latestWeight} كجم` : "لم يسجل بعد"}</strong></div></div></section><section className="mt-6"><div className="mb-4"><p className="eyebrow">اختصارات سريعة</p><h2 className="mt-2 text-2xl font-black">ماذا تريد أن تفتح؟</h2></div><div className="grid gap-3 sm:grid-cols-2">{destinationCards.map(({ href, title, description, icon: Icon }) => <Link key={href} href={href} className="group panel flex min-h-36 items-center gap-4 p-5 transition hover:border-[var(--accent)]"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Icon size={21} /></span><span className="min-w-0 flex-1"><span className="block text-lg font-black">{title}</span><span className="mt-1 block text-sm leading-6 text-[var(--text-muted)]">{description}</span></span><ArrowLeft className="shrink-0 text-[var(--accent)] transition group-hover:-translate-x-1" size={19} /></Link>)}</div></section>{!account.progress_enabled && <p className="mt-6 rounded-[var(--radius-base)] border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">تسجيل التقدم موقوف حاليًا من الكابتن، لكن يمكنك الاطلاع على خططك وبياناتك السابقة.</p>}</div>;
}
