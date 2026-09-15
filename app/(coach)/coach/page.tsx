import Link from "next/link";
import { ArrowLeft, ClipboardList, MessageSquare, UserPlus, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoachHeader } from "@/components/coach/CoachHeader";

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "coach") redirect("/dashboard");

  const [{ count: clientsCount }, { count: activeCount }, { count: leadsCount }] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("coach_id", user.id).eq("status", "active"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("contacted", false),
  ]);

  const stats = [
    { href: "/coach/clients", icon: Users, value: clientsCount ?? 0, label: "إجمالي العملاء", action: "إدارة العملاء" },
    { href: "/coach/clients?status=active", icon: ClipboardList, value: activeCount ?? 0, label: "عملاء نشطون", action: "فتح القائمة" },
    { href: "/coach/leads", icon: MessageSquare, value: leadsCount ?? 0, label: "طلبات جديدة", action: "مراجعة الطلبات" },
  ];

  return <main className="coach-dashboard min-h-screen bg-[var(--bg-ink)] px-4 py-6 text-[var(--text-primary)] sm:px-8 sm:py-8"><div className="mx-auto max-w-6xl"><CoachHeader name={profile.full_name} />
    <section className="coach-welcome border-b border-[var(--border-hairline)] pb-9"><div className="max-w-3xl"><p className="eyebrow">نظرة عامة</p><h2 className="mt-3 text-[clamp(2rem,7vw,4.5rem)] font-black leading-[1.08]">كل يوم مع عميلك، أوضح وأسهل.</h2><p className="mt-4 max-w-xl text-base leading-8 text-[var(--text-muted)]">ابدأ من الطلبات، افتح ملف العميل، وبعدها ابنِ الخطة من مكتبتك.</p></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/coach/clients#new-client" className="cta-button w-full px-5 py-3 sm:w-auto"><UserPlus size={17} /> إضافة عميل</Link><Link href="/coach/leads" className="secondary-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm px-5 py-3 font-bold sm:w-auto">مراجعة الطلبات <ArrowLeft size={16} /></Link></div></section>
    <section className="mt-7 grid gap-3 sm:grid-cols-3">{stats.map(({ href, icon: Icon, value, label, action }) => <Link key={href} href={href} className="coach-stat-card group panel p-5"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Icon size={20} /></span><ArrowLeft size={16} className="text-[var(--text-muted)] transition group-hover:text-[var(--accent)]" /></div><p className="mt-6 text-4xl font-black">{value}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{label}</p><span className="mt-5 block text-sm font-bold text-[var(--accent)]">{action}</span></Link>)}</section>
    <section className="mt-7 grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><div className="panel p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">سير العمل</p><h3 className="mt-2 text-2xl font-black">ابدأ من هنا</h3></div><span className="hidden text-xs text-[var(--text-muted)] sm:block">٣ خطوات بسيطة</span></div><div className="mt-6 grid gap-5 sm:grid-cols-3">{[{ n: "01", title: "راجع الطلبات", text: "تابع المهتمين الجدد." }, { n: "02", title: "افتح ملف العميل", text: "أضف بياناته وخطته." }, { n: "03", title: "حدّث المكتبة", text: "استخدم تمارينك ووجباتك الجاهزة." }].map((item) => <div key={item.n} className="coach-step"><span className="step-number">{item.n}</span><h4 className="mt-3 font-black">{item.title}</h4><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.text}</p></div>)}</div></div><div className="coach-quick panel p-5 sm:p-7"><p className="eyebrow">اختصارات</p><h3 className="mt-2 text-2xl font-black">شغل أسرع</h3><div className="mt-6 space-y-2"><Link href="/coach/clients#new-client" className="quick-link"><UserPlus size={17} /> إضافة عميل جديد <ArrowLeft size={15} /></Link><Link href="/coach/library" className="quick-link"><ClipboardList size={17} /> فتح مكتبة التمارين والوجبات <ArrowLeft size={15} /></Link><Link href="/coach/leads" className="quick-link"><MessageSquare size={17} /> متابعة طلبات التواصل <ArrowLeft size={15} /></Link></div></div></section>
  </div></main>;
}
