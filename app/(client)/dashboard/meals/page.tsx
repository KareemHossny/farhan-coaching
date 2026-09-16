import { Utensils } from "lucide-react";
import { PlanView } from "@/components/client/PlanView";
import { getClientDashboardSession, getClientPlans } from "@/lib/client-dashboard";

export default async function MealsPage() {
  const { supabase } = await getClientDashboardSession();
  const plans = await getClientPlans(supabase);
  const diet = plans.find((plan) => plan.type === "diet");
  return <div className="mx-auto max-w-4xl"><header className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Utensils size={22} /></span><div><p className="eyebrow">خطة التغذية</p><h2 className="mt-2 text-3xl font-black">وجباتك</h2><p className="mt-2 leading-7 text-[var(--text-muted)]">اختر اليوم وستجد كل وجبة باسمها والجرامات المحددة لك.</p></div></header><div className="mt-6"><PlanView diet={diet} today={new Date().getDay()} section="diet" /></div></div>;
}
