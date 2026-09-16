import { Trophy } from "lucide-react";
import { ExercisePerformanceSection, type ExercisePerformanceRecord } from "@/components/client/ExercisePerformanceSection";
import { getClientDashboardSession, getClientPlans } from "@/lib/client-dashboard";

export default async function StrengthPage() {
  const { supabase, user } = await getClientDashboardSession();
  const [plans, { data: records, error }] = await Promise.all([getClientPlans(supabase), supabase.from("exercise_performance_records").select("plan_item_id, exercise_key, max_weight_kg, max_reps").eq("client_id", user.id).order("updated_at", { ascending: false })]);
  if (error) throw new Error("تعذر تحميل أداء التمارين.");
  const workout = plans.find((plan) => plan.type === "workout");
  return <div className="mx-auto max-w-4xl"><header className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Trophy size={22} /></span><div><p className="eyebrow">متابعة القوة</p><h2 className="mt-2 text-3xl font-black">الأوزان والعدات</h2><p className="mt-2 leading-7 text-[var(--text-muted)]">سجل واحد قابل للتعديل لكل تمرين حتى يتابع الكابتن أقوى أداء وصلت له.</p></div></header>{workout ? <ExercisePerformanceSection items={workout.plan_items} records={(records ?? []) as ExercisePerformanceRecord[]} /> : <p className="panel mt-6 p-8 text-center text-[var(--text-muted)]">لم يضف الكابتن خطة تمارين بعد.</p>}</div>;
}
