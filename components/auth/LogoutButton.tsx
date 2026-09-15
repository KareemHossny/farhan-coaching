"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { signOut } from "@/app/actions/auth";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await signOut();
      toast.success("تم تسجيل الخروج");
      router.replace("/login");
      router.refresh();
    });
  }

  return <button type="button" onClick={logout} disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-[var(--border-hairline)] px-3 py-2 text-sm font-bold text-[var(--text-muted)] transition hover:border-red-400 hover:text-red-300 disabled:opacity-50"><LogOut size={16} />{pending ? "جاري الخروج..." : "تسجيل الخروج"}</button>;
}
