import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoachHeader } from "@/components/coach/CoachHeader";
import { LeadActions } from "@/components/coach/LeadActions";

export default async function CoachLeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "coach") redirect("/dashboard");
  const { data: leads, error } = await supabase.from("leads").select("id, name, phone, message, created_at").eq("contacted", false).order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[var(--bg-ink)] px-4 py-8 text-[var(--text-primary)] sm:px-8"><div className="mx-auto max-w-6xl"><CoachHeader name={profile?.full_name} /><header className="flex items-end justify-between border-b border-[var(--border-hairline)] pb-8"><div><p className="eyebrow">فرص جديدة</p><h2 className="mt-3 text-3xl font-black">طلبات التواصل</h2><p className="mt-2 text-[var(--text-muted)]">راجع المهتمين وتواصل معهم أو حوّلهم إلى عملاء.</p></div><Link href="/coach/clients#new-client" className="secondary-button hidden items-center gap-2 rounded-sm px-4 py-3 font-bold sm:inline-flex">إضافة عميل <ArrowLeft size={16} /></Link></header>{error && <p className="mt-6 border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">تعذر تحميل الطلبات. حاول تحديث الصفحة.</p>}<section className="mt-8 overflow-hidden border border-[var(--border-hairline)] bg-[var(--surface)]">{leads?.length ? <div className="divide-y divide-[var(--border-hairline)]">{leads.map((lead) => <div key={lead.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-extrabold">{lead.name}</p><p className="mt-1 text-sm text-[var(--accent)]" dir="ltr">{lead.phone}</p>{lead.message && <p className="mt-2 text-sm text-[var(--text-muted)]">{lead.message}</p>}<time className="mt-2 block text-xs text-[var(--text-muted)]" dateTime={lead.created_at}>{new Date(lead.created_at).toLocaleDateString("ar-EG")}</time></div><LeadActions leadId={lead.id} leadName={lead.name} leadPhone={lead.phone} /></div>)}</div> : <div className="p-12 text-center text-[var(--text-muted)]">لا توجد طلبات جديدة.</div>}</section></div></main>;
}
