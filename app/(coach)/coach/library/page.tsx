import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LibraryManager } from "@/components/coach/LibraryManager";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "coach") redirect("/dashboard");
  const [{ data: exercises }, { data: meals }] = await Promise.all([supabase.from("exercise_library").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }), supabase.from("meal_library").select("*").eq("coach_id", user.id).order("created_at", { ascending: false })]);
  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8"><div className="mx-auto max-w-6xl"><a href="/coach" className="text-sm text-lime-300">← العودة إلى لوحة المدرب</a><h1 className="mt-6 text-3xl font-black">المكتبة</h1><p className="mt-2 text-slate-400">أضف تمارين ووجبات لإعادة استخدامها في خطط العملاء.</p><LibraryManager exercises={exercises ?? []} meals={meals ?? []} /></div></main>;
}
