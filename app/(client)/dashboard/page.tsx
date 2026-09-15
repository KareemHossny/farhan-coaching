import { CalendarDays, Scale, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { PlanView, type ClientPlanItem } from "@/components/client/PlanView";
import { ProgressLogForm } from "@/components/client/ProgressLogForm";
import { ProgressPhotoGallery } from "@/components/client/ProgressPhotoGallery";
import { WeightHistoryChart } from "@/components/client/WeightHistoryChart";
import { createClient } from "@/lib/supabase/server";
import { createProgressPhotoUrl } from "@/lib/progress-photos";

type ClientPlan = { id: string; type: "workout" | "diet"; title: string; start_date: string | null; end_date: string | null; plan_items: ClientPlanItem[] };

function groupPlanItems(items: ClientPlanItem[]): ClientPlan[] {
  const plans = new Map<string, ClientPlan>();
  for (const item of items) {
    const plan = plans.get(item.plan_id) ?? { id: item.plan_id, type: item.plan_type, title: item.plan_title, start_date: item.start_date, end_date: item.end_date, plan_items: [] };
    plan.plan_items.push(item);
    plans.set(item.plan_id, plan);
  }
  return [...plans.values()];
}

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: account }, { data: progress }] = await Promise.all([
    supabase.rpc("get_client_account").maybeSingle(),
    supabase.from("progress_logs").select("date, weight_kg, note, photo_url").eq("client_id", user.id).order("date", { ascending: true }),
  ]);
  if (!account) redirect("/login");

  if (account.status !== "active") return <main className="min-h-screen bg-[var(--bg-ink)] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8"><div className="mx-auto max-w-2xl"><ClientHeader name={account.full_name} /><section className="client-status-card panel mt-8 p-6 sm:p-9" aria-live="polite"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Sparkles size={24} /></div><p className="eyebrow mt-7">{account.status === "pending" ? "الحساب غير مفعل" : "الحساب متوقف"}</p><h2 className="mt-3 text-3xl font-black">{account.status === "pending" ? "حسابك جاهز، لكن لم يتم تفعيله بعد." : "حسابك متوقف مؤقتًا من الكابتن."}</h2><p className="mt-4 leading-8 text-[var(--text-muted)]">{account.status === "pending" ? "تواصل مع الكابتن عبر واتساب لمعرفة الخطوة التالية." : "ستظهر خطتك وتسجيل التقدم مرة أخرى بعد إعادة تفعيل الحساب."}</p></section></div></main>;

  const { data: safeItems, error: planError } = await supabase.rpc("get_client_plan_items");
  const plans = groupPlanItems((safeItems ?? []) as ClientPlanItem[]);
  const workout = plans.find((plan) => plan.type === "workout");
  const diet = plans.find((plan) => plan.type === "diet");
  const chartData = (progress ?? []).map((log) => ({ date: log.date, weight: Number(log.weight_kg) }));
  const latestWeight = chartData.at(-1)?.weight;
  const today = new Date().getDay();
  const progressPhotos = (await Promise.all((progress ?? []).map(async (log) => ({ date: log.date, url: await createProgressPhotoUrl(supabase, log.photo_url) })))).filter((photo): photo is { date: string; url: string } => Boolean(photo.url));

  return <main className="client-dashboard min-h-screen bg-[var(--bg-ink)] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8"><div className="mx-auto max-w-4xl"><ClientHeader name={account.full_name} /><section className="client-welcome panel mb-5 p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">مساحتك التدريبية</p><h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">جاهز لخطوة النهارده؟</h2><p className="mt-3 max-w-xl leading-7 text-[var(--text-muted)]">خطتك قدامك، اختار يومك وسجل تقدمك في أقل من دقيقة.</p></div><span className="hidden h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg-ink)] sm:flex"><Sparkles size={22} /></span></div><div className="mt-6 grid grid-cols-2 gap-2 sm:max-w-md"><div className="client-summary-tile"><CalendarDays size={17} /><span>اليوم</span><strong>{["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][today]}</strong></div><div className="client-summary-tile"><Scale size={17} /><span>آخر وزن</span><strong>{latestWeight ? `${latestWeight} كجم` : "لم يسجل بعد"}</strong></div></div></section>{planError && <p className="mb-5 rounded-[var(--radius-base)] border border-red-900 bg-red-950/30 p-4 text-sm text-red-300" role="alert">تعذر تحميل الخطط. حاول تحديث الصفحة.</p>}<PlanView workout={workout} diet={diet} today={today} />{account.progress_enabled ? <section className="client-progress-section panel mt-5 p-5 sm:p-7"><div><p className="eyebrow">المتابعة</p><h2 className="mt-2 text-2xl font-black">سجل تقدمك</h2><p className="mt-2 text-[var(--text-muted)]">وزنك وملاحظتك يساعدوا الكابتن يطوّر خطتك.</p></div><ProgressLogForm /></section> : <section className="client-progress-disabled panel mt-5 p-5 sm:p-7" aria-live="polite"><p className="eyebrow">المتابعة</p><h2 className="mt-2 text-2xl font-black">تسجيل التقدم متوقف حاليًا</h2><p className="mt-3 leading-7 text-[var(--text-muted)]">الكابتن أوقف إرسال الوزن والصور مؤقتًا. ستتمكن من التسجيل مرة أخرى عند تفعيل المتابعة.</p></section>}<section className="panel mt-5 p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">رحلتك بالأرقام</p><h2 className="mt-2 text-2xl font-black">تاريخ الوزن</h2></div>{chartData.length > 1 && <span className="text-xs text-[var(--text-muted)]">{chartData.length} تسجيلات</span>}</div><div className="mt-5"><WeightHistoryChart data={chartData} /></div></section><section className="panel mt-5 p-5 sm:p-7"><div className="mb-5"><p className="eyebrow">صور الرحلة</p><h2 className="mt-2 text-2xl font-black">تقدمك بالصور</h2><p className="mt-2 text-sm text-[var(--text-muted)]">صورك خاصة بك ولا يراها إلا أنت والكابتن.</p></div><ProgressPhotoGallery photos={progressPhotos} /></section></div></main>;
}

function ClientHeader({ name }: { name: string | null }) {
  return <header className="mb-7 flex flex-col gap-4 border-b border-[var(--border-hairline)] pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">لوحة العميل</p><h1 className="mt-2 text-xl font-black">أهلًا {name ?? "بك"}</h1></div><LogoutButton /></header>;
}
