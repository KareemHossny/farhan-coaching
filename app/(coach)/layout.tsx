import { redirect } from "next/navigation";
import { CoachDashboardNav } from "@/components/coach/CoachDashboardNav";
import { createClient } from "@/lib/supabase/server";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "coach") redirect("/dashboard");
  return <CoachDashboardNav name={profile.full_name}>{children}</CoachDashboardNav>;
}
