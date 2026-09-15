import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "coach" | "client";

export async function getCurrentUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role as UserRole | undefined;
}

export async function requireRole(role: UserRole) {
  const currentRole = await getCurrentUserRole();

  if (currentRole !== role) {
    redirect(currentRole === "coach" ? "/coach" : currentRole === "client" ? "/dashboard" : "/login");
  }
}
