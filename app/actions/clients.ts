"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function setClientStatus(clientId: string, status: "active" | "paused") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول كمدرب أولًا." };
    const { data: coach } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (coach?.role !== "coach") return { error: "ليست لديك صلاحية تعديل العملاء." };
    const { error } = await supabase.from("clients").update({ status }).eq("id", clientId).eq("coach_id", user.id);
    if (error) return { error: "تعذر تحديث حالة العميل." };
    revalidatePath("/coach/clients");
    revalidatePath("/coach");
    return { success: status === "paused" ? "تم إيقاف حساب العميل." : "تم تفعيل حساب العميل." };
  } catch (error) {
    console.error("setClientStatus failed", error);
    return { error: "حدث خطأ أثناء تحديث حساب العميل." };
  }
}

export async function setClientProgressEnabled(clientId: string, enabled: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول كمدرب أولًا." };
    const { data: coach } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (coach?.role !== "coach") return { error: "ليست لديك صلاحية تعديل متابعة العملاء." };

    const { error } = await supabase
      .from("clients")
      .update({ progress_enabled: enabled })
      .eq("id", clientId)
      .eq("coach_id", user.id);
    if (error) return { error: "تعذر تحديث إعدادات متابعة العميل." };

    revalidatePath("/coach/clients");
    revalidatePath(`/coach/clients/${clientId}`);
    revalidatePath("/dashboard");
    return { success: enabled ? "تم تفعيل إرسال التقدم للعميل." : "تم إيقاف إرسال التقدم للعميل." };
  } catch (error) {
    console.error("setClientProgressEnabled failed", error);
    return { error: "حدث خطأ أثناء تحديث إعدادات متابعة العميل." };
  }
}

export async function removeClientAccount(clientId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول كمدرب أولًا." };
    const { data: coach } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (coach?.role !== "coach") return { error: "ليست لديك صلاحية حذف العملاء." };
    const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("coach_id", user.id).maybeSingle();
    if (!client) return { error: "العميل غير موجود أو لا يتبع حسابك." };

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(clientId);
    if (error) return { error: "تعذر حذف حساب العميل." };
    revalidatePath("/coach/clients");
    revalidatePath("/coach");
    return { success: "تم حذف حساب العميل وبياناته المرتبطة." };
  } catch (error) {
    console.error("removeClientAccount failed", error);
    return { error: "حدث خطأ أثناء حذف حساب العميل." };
  }
}
