import { Activity, Scale } from "lucide-react";
import { ProgressLogForm } from "@/components/client/ProgressLogForm";
import { ProgressPhotoGallery } from "@/components/client/ProgressPhotoGallery";
import { WeightHistoryChart } from "@/components/client/WeightHistoryChart";
import { getClientDashboardSession } from "@/lib/client-dashboard";
import { createProgressPhotoUrl } from "@/lib/progress-photos";

export default async function ProgressPage() {
  const { supabase, user, account } = await getClientDashboardSession();
  const { data: progress, error } = await supabase.from("progress_logs").select("date, weight_kg, photo_url").eq("client_id", user.id).order("date", { ascending: true });
  if (error) throw new Error("تعذر تحميل سجل التقدم.");
  const chartData = (progress ?? []).map((log) => ({ date: log.date, weight: Number(log.weight_kg) }));
  const progressPhotos = (await Promise.all((progress ?? []).map(async (log) => ({ date: log.date, url: await createProgressPhotoUrl(supabase, log.photo_url) })))).filter((photo): photo is { date: string; url: string } => Boolean(photo.url));
  return <div className="mx-auto max-w-4xl"><header className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Activity size={22} /></span><div><p className="eyebrow">متابعة الرحلة</p><h2 className="mt-2 text-3xl font-black">التقدم والوزن</h2><p className="mt-2 leading-7 text-[var(--text-muted)]">سجل وزنك وصورتك، ثم تابع تغيرك بالأرقام والصور.</p></div></header>{account.progress_enabled ? <section className="client-progress-section panel mt-6 p-5 sm:p-7"><h3 className="text-xl font-black">سجل تقدمك اليوم</h3><ProgressLogForm /></section> : <section className="client-progress-disabled panel mt-6 p-5 sm:p-7" aria-live="polite"><h3 className="text-xl font-black">تسجيل التقدم متوقف حاليًا</h3><p className="mt-3 leading-7 text-[var(--text-muted)]">الكابتن أوقف إرسال الوزن والصور مؤقتًا. ستتمكن من التسجيل مرة أخرى عند تفعيل المتابعة.</p></section>}<section className="panel mt-5 p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">رحلتك بالأرقام</p><h3 className="mt-2 text-2xl font-black">تاريخ الوزن</h3></div><Scale className="text-[var(--accent)]" size={22} /></div><div className="mt-5"><WeightHistoryChart data={chartData} /></div></section><section className="panel mt-5 p-5 sm:p-7"><div className="mb-5"><p className="eyebrow">صور الرحلة</p><h3 className="mt-2 text-2xl font-black">تقدمك بالصور</h3><p className="mt-2 text-sm text-[var(--text-muted)]">صورك خاصة بك ولا يراها إلا أنت والكابتن.</p></div><ProgressPhotoGallery photos={progressPhotos} /></section></div>;
}
