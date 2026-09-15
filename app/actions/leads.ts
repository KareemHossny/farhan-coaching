"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LeadActionState = { error?: string; success?: boolean };

export async function submitLead(_previous: LeadActionState, formData: FormData): Promise<LeadActionState> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (name.length < 2 || name.length > 120 || !phone || phone.length > 40 || message.length > 1000) {
      return { error: "من فضلك راجع الاسم ورقم الهاتف والرسالة." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({ name, phone, message: message || null });
    if (error) {
      console.error("submitLead failed", { code: error.code, message: error.message });
      return { error: "تعذر إرسال الطلب. حاول مرة أخرى أو تواصل معنا عبر واتساب." };
    }

    return { success: true };
  } catch (error) {
    console.error("submitLead failed", error);
    return { error: "حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى." };
  }
}

export async function markLeadContacted(leadId: string): Promise<{ error?: string; success?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول أولًا." };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "coach") return { error: "ليست لديك صلاحية تعديل الطلبات." };

    const { error } = await supabase.from("leads").update({ contacted: true }).eq("id", leadId);
    if (error) return { error: "تعذر تحديث حالة الطلب." };

    revalidatePath("/coach");
    revalidatePath("/coach/leads");
    return { success: "تم تسجيل التواصل مع العميل." };
  } catch (error) {
    console.error("markLeadContacted failed", error);
    return { error: "حدث خطأ أثناء تحديث الطلب." };
  }
}
