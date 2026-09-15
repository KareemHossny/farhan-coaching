import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgressChart } from "@/components/coach/ProgressChart";
import { LibraryPlanBuilder, type BuilderItem } from "@/components/coach/LibraryPlanBuilder";
import { ProgressPhotoGallery } from "@/components/coach/ProgressPhotoGallery";
import { createProgressPhotoUrl } from "@/lib/progress-photos";

type Params = Promise<{ id: string }>;
type PlanItemRow = { id: string; plan_id: string; day_of_week: number; order_index: number; library_item_id: string | null; meal_label: string | null; override_grams: number | null; name: string | null; details: Record<string, unknown> | null; override_sets: number | null; override_reps: string | null; override_calories: number | null };
type PlanRow = { id: string; type: "workout" | "diet"; title: string; start_date: string | null; end_date: string | null };

function asNumber(value: unknown): string { return typeof value === "number" ? String(value) : ""; }

function toItems(items: PlanItemRow[]): BuilderItem[] {
  return items.map((item) => ({
    dayOfWeek: item.day_of_week,
    orderIndex: item.order_index,
    name: item.name ?? "",
    libraryItemId: item.library_item_id ?? undefined,
    mealLabel: item.meal_label ?? "الإفطار",
    overrideGrams: asNumber(item.override_grams),
    sets: item.override_sets !== null ? String(item.override_sets) : asNumber(item.details?.sets),
    reps: item.override_reps ?? (typeof item.details?.reps === "string" ? item.details.reps : ""),
    restSeconds: asNumber(item.details?.rest_seconds),
    calories: item.override_calories !== null ? String(item.override_calories) : "",
    proteinG: asNumber(item.details?.protein_g),
    carbsG: asNumber(item.details?.carbs_g),
    fatsG: asNumber(item.details?.fats_g),
  }));
}

export default async function ClientPlanPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase.from("clients").select("id, status, goal, height_cm, starting_weight_kg, profiles!clients_id_fkey(full_name, phone, avatar_url)").eq("id", id).eq("coach_id", user.id).maybeSingle();
  if (!client) notFound();

  const [{ data: plans, error: plansError }, { data: progress }, { data: exercises }, { data: meals }] = await Promise.all([
    supabase.from("plans").select("id, type, title, start_date, end_date").eq("client_id", id).eq("coach_id", user.id),
    supabase.from("progress_logs").select("date, weight_kg, photo_url").eq("client_id", id).order("date", { ascending: true }),
    supabase.from("exercise_library").select("id, name, youtube_url, default_sets, default_reps, default_rest_seconds").eq("coach_id", user.id).order("name"),
    supabase.from("meal_library").select("id, name, calories, protein_g, carbs_g, fats_g, macro_reference_grams").eq("coach_id", user.id).order("name"),
  ]);
  if (plansError) throw new Error("تعذر تحميل الخطط.");

  const planRows = (plans ?? []) as PlanRow[];
  const planIds = planRows.map((plan) => plan.id);
  const { data: planItems, error: itemsError } = planIds.length
    ? await supabase.from("plan_items").select("id, plan_id, day_of_week, order_index, library_item_id, meal_label, override_grams, name, details, override_sets, override_reps, override_calories").in("plan_id", planIds).order("order_index")
    : { data: [], error: null };
  if (itemsError) throw new Error("تعذر تحميل عناصر الخطط.");

  const itemsByPlan = new Map<string, PlanItemRow[]>();
  for (const item of (planItems ?? []) as PlanItemRow[]) itemsByPlan.set(item.plan_id, [...(itemsByPlan.get(item.plan_id) ?? []), item]);
  const workout = planRows.find((plan) => plan.type === "workout");
  const diet = planRows.find((plan) => plan.type === "diet");
  const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
  const chartData = (progress ?? []).map((log) => ({ date: log.date, weight: Number(log.weight_kg) }));
  const progressPhotos = (await Promise.all((progress ?? []).map(async (log) => ({ date: log.date, url: await createProgressPhotoUrl(supabase, log.photo_url) })))).filter((photo): photo is { date: string; url: string } => Boolean(photo.url));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8"><div className="mx-auto max-w-6xl">
      <Link href="/coach" className="text-sm text-lime-300">← العودة إلى العملاء</Link>
      <div className="mt-6"><p className="text-sm text-lime-300">ملف العميل</p><h1 className="mt-2 text-3xl font-black">{profile?.full_name ?? "عميل بدون اسم"}</h1><p className="mt-2 text-slate-400">{client.goal ?? "لم يتم تحديد الهدف بعد"} · {client.height_cm ? `${client.height_cm} سم` : "الطول غير مسجل"}</p></div>
      <section className="mt-8 rounded-xl border border-white/10 bg-slate-900 p-4 sm:p-6"><h2 className="text-xl font-bold">تقدم الوزن</h2><p className="mt-1 text-slate-400">الوزن الابتدائي: {client.starting_weight_kg ? `${client.starting_weight_kg} كجم` : "غير مسجل"}</p><div className="mt-5"><ProgressChart data={chartData} /></div></section>
      <section className="mt-5 rounded-xl border border-white/10 bg-slate-900 p-4 sm:p-6"><div className="mb-5"><h2 className="text-xl font-bold">صور التقدم</h2><p className="mt-1 text-sm text-slate-400">الصور متاحة لك وللكابتن فقط.</p></div><ProgressPhotoGallery photos={progressPhotos} /></section>
      <section className="mt-10"><h2 className="text-2xl font-black">بناء الخطط</h2><p className="mt-2 text-slate-400">اختر من المكتبة أو أضف عنصرًا مخصصًا لكل يوم.</p><LibraryPlanBuilder clientId={id} exercises={exercises ?? []} meals={meals ?? []} initialWorkout={{ id: workout?.id, title: workout?.title ?? "خطة التمرين", startDate: workout?.start_date ?? "", endDate: workout?.end_date ?? "", items: workout ? toItems(itemsByPlan.get(workout.id) ?? []) : [] }} initialDiet={{ id: diet?.id, title: diet?.title ?? "خطة التغذية", startDate: diet?.start_date ?? "", endDate: diet?.end_date ?? "", items: diet ? toItems(itemsByPlan.get(diet.id) ?? []) : [] }} /></section>
    </div></main>
  );
}
