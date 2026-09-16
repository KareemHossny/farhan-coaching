import { Sparkles } from "lucide-react";
import { ClientDashboardNav } from "@/components/client/ClientDashboardNav";
import { getClientDashboardSession } from "@/lib/client-dashboard";

export default async function ClientDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { account } = await getClientDashboardSession();

  return (
    <ClientDashboardNav name={account.full_name}>
      {account.status === "active" ? children : <AccountStatus status={account.status} />}
    </ClientDashboardNav>
  );
}

function AccountStatus({ status }: { status: "paused" | "pending" }) {
  const pending = status === "pending";
  return <section className="client-status-card panel mx-auto max-w-2xl p-6 sm:p-9" aria-live="polite"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Sparkles size={24} /></div><p className="eyebrow mt-7">{pending ? "الحساب غير مفعل" : "الحساب متوقف"}</p><h2 className="mt-3 text-3xl font-black">{pending ? "حسابك جاهز، لكن لم يتم تفعيله بعد." : "حسابك متوقف مؤقتًا من الكابتن."}</h2><p className="mt-4 leading-8 text-[var(--text-muted)]">{pending ? "تواصل مع الكابتن لمعرفة الخطوة التالية." : "ستظهر خطتك وأدوات المتابعة مرة أخرى بعد إعادة تفعيل الحساب."}</p></section>;
}
