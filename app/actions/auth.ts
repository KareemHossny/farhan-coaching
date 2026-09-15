"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string; success?: string };

export async function signIn(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "من فضلك أدخل البريد الإلكتروني وكلمة المرور." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const networkError = error.name === "AuthRetryableFetchError" || error.message.toLowerCase().includes("fetch failed");
      return { error: networkError ? "تعذر الاتصال بخدمة تسجيل الدخول. تحقق من الإنترنت وحاول مرة أخرى." : "بيانات تسجيل الدخول غير صحيحة." };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "تعذر التحقق من الحساب. حاول مرة أخرى." };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "coach") return { success: "coach" };
    if (profile?.role === "client") return { success: "client" };

    await supabase.auth.signOut();
    return { error: "هذا الحساب غير مكتمل الإعداد. تواصل مع المدرب." };
  } catch (error) {
    console.error("signIn failed", error);
    return { error: "تعذر الاتصال بخدمة تسجيل الدخول. تحقق من إعدادات Supabase وحاول مرة أخرى." };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("signOut failed", error);
  }
}

async function createClientAccountUnsafe(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createClient();
  const { data: { user: coach } } = await supabase.auth.getUser();
  if (!coach) return { error: "يجب تسجيل الدخول كمدرب أولًا." };

  const { data: coachProfile } = await supabase.from("profiles").select("role").eq("id", coach.id).maybeSingle();
  if (coachProfile?.role !== "coach") return { error: "ليست لديك صلاحية إنشاء حسابات عملاء." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const goal = String(formData.get("goal") ?? "").trim() || null;
  const leadId = String(formData.get("lead_id") ?? "").trim() || null;

  if (fullName.length < 2 || fullName.length > 120 || !email || password.length < 6) {
    return { error: "أدخل اسمًا صحيحًا والبريد وكلمة مرور لا تقل عن 6 أحرف." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "إعدادات Supabase الخاصة بالخادم غير مكتملة." };
  }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !created.user) {
    console.error("create client auth user failed", { code: authError?.code, message: authError?.message });
    const duplicate = authError?.message.toLowerCase().includes("already") || authError?.message.toLowerCase().includes("registered");
    return { error: duplicate ? "هذا البريد الإلكتروني مستخدم بالفعل." : "تعذر إنشاء حساب العميل. راجع بيانات Supabase وحاول مرة أخرى." };
  }

  const clientRecordResult = await admin.rpc("create_client_record", {
    p_client_id: created.user.id,
    p_coach_id: coach.id,
    p_full_name: fullName,
    p_phone: phone,
    p_goal: goal,
  });

  if (clientRecordResult.error) {
    console.error("create client record failed", { code: clientRecordResult.error.code, message: clientRecordResult.error.message });
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "تعذر حفظ بيانات العميل، وتم حذف الحساب غير المكتمل." };
  }

  if (leadId) {
    const { error: leadError } = await supabase.from("leads").update({ contacted: true }).eq("id", leadId);
    if (leadError) console.error("mark converted lead failed", { code: leadError.code, message: leadError.message });
  }

  revalidatePath("/coach");
  revalidatePath("/coach/clients");
  return { success: "تم إنشاء حساب العميل بنجاح." };
}

export async function createClientAccount(previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    return await createClientAccountUnsafe(previousState, formData);
  } catch (error) {
    console.error("createClientAccount failed", error);
    return { error: "حدث خطأ غير متوقع أثناء إنشاء الحساب. تحقق من إعدادات Supabase وحاول مرة أخرى." };
  }
}
