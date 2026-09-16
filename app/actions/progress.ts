"use server";

import { createClient } from "@/lib/supabase/server";

export type ProgressActionState = { error?: string; success?: string };

export async function logProgress(_previous: ProgressActionState, formData: FormData): Promise<ProgressActionState> {
  let uploadedPath: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول أولًا." };

    const { data: clientSettings, error: settingsError } = await supabase.rpc("get_client_account").maybeSingle();
    if (settingsError) {
      console.error("logProgress account settings failed", { code: settingsError.code, message: settingsError.message });
      return { error: "تعذر التحقق من إعدادات تسجيل التقدم. تأكد من تطبيق migration 0009 في Supabase ثم حاول مرة أخرى." };
    }
    if (!clientSettings) return { error: "لم يتم العثور على حساب العميل. سجّل الخروج ثم ادخل مرة أخرى." };
    if (clientSettings.status !== "active") return { error: "الحساب غير نشط حاليًا. تواصل مع الكابتن." };
    if (!clientSettings.progress_enabled) return { error: "تسجيل التقدم متوقف حاليًا من الكابتن." };

    const weight = Number(formData.get("weight_kg"));
    const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
    const photo = formData.get("photo");
    const date = new Date().toISOString().slice(0, 10);

    if (!Number.isFinite(weight) || weight <= 0 || weight > 500) return { error: "أدخل وزنًا صحيحًا." };

    const { data: previousLog } = await supabase.from("progress_logs").select("photo_url").eq("client_id", user.id).eq("date", date).maybeSingle();
    let photoUrl = previousLog?.photo_url ?? null;

    if (photo instanceof File && photo.size > 0) {
      if (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024) return { error: "اختر صورة أقل من 5 ميجابايت." };
      const extension = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      uploadedPath = `${user.id}/${date}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("progress-photos").upload(uploadedPath, photo, { contentType: photo.type, upsert: false });
      if (uploadError) return { error: "تعذر رفع الصورة. حاول مرة أخرى أو احفظ الوزن بدون صورة." };
      photoUrl = uploadedPath;
    }

    const { error } = await supabase.from("progress_logs").upsert({ client_id: user.id, date, weight_kg: weight, photo_url: photoUrl, note }, { onConflict: "client_id,date" });
    if (error) {
      console.error("logProgress save failed", { code: error.code, message: error.message });
      if (uploadedPath) await supabase.storage.from("progress-photos").remove([uploadedPath]);
      return { error: "تعذر حفظ التقدم. حاول مرة أخرى." };
    }

    if (uploadedPath && previousLog?.photo_url && previousLog.photo_url !== uploadedPath) {
      await supabase.storage.from("progress-photos").remove([previousLog.photo_url]);
    }

    return { success: "تم تسجيل تقدمك اليوم." };
  } catch (error) {
    console.error("logProgress failed", error);
    return { error: "حدث خطأ أثناء تسجيل التقدم. حاول مرة أخرى." };
  }
}
