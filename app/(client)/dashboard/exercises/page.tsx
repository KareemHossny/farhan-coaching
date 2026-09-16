import { Dumbbell } from "lucide-react";
import { PlanView } from "@/components/client/PlanView";
import { getClientDashboardSession, getClientPlans } from "@/lib/client-dashboard";

export default async function ExercisesPage() {
  const { supabase } = await getClientDashboardSession();
  const plans = await getClientPlans(supabase);
  const workout = plans.find((plan) => plan.type === "workout");
  return <div className="mx-auto max-w-4xl"><header className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Dumbbell size={22} /></span><div><p className="eyebrow">خطة التدريب</p><h2 className="mt-2 text-3xl font-black">تمارينك</h2><p className="mt-2 leading-7 text-[var(--text-muted)]">اختر اليوم وشاهد التمرين، التكرارات، وفيديو التنفيذ.</p></div></header><div className="mt-6"><PlanView workout={workout} today={new Date().getDay()} section="workout" /></div></div>;
}
