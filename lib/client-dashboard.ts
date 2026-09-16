import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { ClientPlanItem } from "@/components/client/PlanView";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type ClientDatabaseClient = SupabaseClient<Database>;

export type ClientAccount = {
  id: string;
  status: "active" | "paused" | "pending";
  full_name: string | null;
  progress_enabled: boolean;
};

export type ClientPlan = {
  id: string;
  type: "workout" | "diet";
  title: string;
  start_date: string | null;
  end_date: string | null;
  plan_items: ClientPlanItem[];
};

export async function getClientDashboardSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("get_client_account").maybeSingle();
  if (error) throw new Error("تعذر تحميل حساب العميل.");
  if (!data) redirect("/login");

  return { supabase, user, account: data as ClientAccount };
}

export function groupClientPlanItems(items: ClientPlanItem[]): ClientPlan[] {
  const plans = new Map<string, ClientPlan>();
  for (const item of items) {
    const plan = plans.get(item.plan_id) ?? {
      id: item.plan_id,
      type: item.plan_type,
      title: item.plan_title,
      start_date: item.start_date,
      end_date: item.end_date,
      plan_items: [],
    };
    plan.plan_items.push(item);
    plans.set(item.plan_id, plan);
  }
  return [...plans.values()];
}

export async function getClientPlans(supabase: ClientDatabaseClient) {
  const { data, error } = await supabase.rpc("get_client_plan_items");
  if (error) throw new Error("تعذر تحميل الخطط.");
  return groupClientPlanItems((data ?? []) as ClientPlanItem[]);
}
