"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractYoutubeId } from "@/lib/youtube";
import type { Database } from "@/lib/database.types";

export type LibraryActionState = { error?: string; success?: string };
type ExerciseInsert = Database["public"]["Tables"]["exercise_library"]["Insert"];
type MealInsert = Database["public"]["Tables"]["meal_library"]["Insert"];

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function positiveNumber(value: FormDataEntryValue | null): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function saveLibraryItem(type: "exercise" | "meal", _previousState: LibraryActionState, formData: FormData): Promise<LibraryActionState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول أولًا." };
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "coach") return { error: "ليس لديك صلاحية تعديل المكتبة." };
    const id = String(formData.get("id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    if (!name || name.length > 160) return { error: "اسم العنصر مطلوب وألا يتجاوز 160 حرفًا." };

    if (type === "exercise") {
      const youtubeUrl = String(formData.get("youtube_url") ?? "").trim() || null;
      if (youtubeUrl && !extractYoutubeId(youtubeUrl)) return { error: "أدخل رابط YouTube صحيحًا." };
      const payload: ExerciseInsert = { coach_id: user.id, name, muscle_group: String(formData.get("muscle_group") ?? "").trim() || null, youtube_url: youtubeUrl, default_sets: numberOrNull(formData.get("default_sets")), default_reps: String(formData.get("default_reps") ?? "").trim() || null, default_rest_seconds: numberOrNull(formData.get("default_rest_seconds")), notes: String(formData.get("notes") ?? "").trim() || null };
      const result = id ? await supabase.from("exercise_library").update(payload).eq("id", id).eq("coach_id", user.id) : await supabase.from("exercise_library").insert(payload);
      if (result.error) return { error: "تعذر حفظ التمرين. راجع بيانات Supabase ثم حاول مرة أخرى." };
    } else {
      const macroReferenceGrams = positiveNumber(formData.get("macro_reference_grams"));
      if (!macroReferenceGrams) return { error: "يجب تحديد الجرامات التي تخصها قيم الماكروز." };
      const payload: MealInsert = { coach_id: user.id, name, calories: numberOrNull(formData.get("calories")), protein_g: numberOrNull(formData.get("protein_g")), carbs_g: numberOrNull(formData.get("carbs_g")), fats_g: numberOrNull(formData.get("fats_g")), macro_reference_grams: macroReferenceGrams, notes: String(formData.get("notes") ?? "").trim() || null };
      const result = id ? await supabase.from("meal_library").update(payload).eq("id", id).eq("coach_id", user.id) : await supabase.from("meal_library").insert(payload);
      if (result.error) return { error: "تعذر حفظ الوجبة. راجع بيانات Supabase ثم حاول مرة أخرى." };
    }
    revalidatePath("/coach/library");
    return { success: "تم حفظ العنصر." };
  } catch (error) {
    console.error("saveLibraryItem failed", error instanceof Error ? error.message : "unknown error");
    return { error: "حدث خطأ أثناء الحفظ. أعد تحميل الصفحة وحاول مرة أخرى." };
  }
}

export async function deleteLibraryItem(type: "exercise" | "meal", id: string): Promise<LibraryActionState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول أولًا." };
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "coach") return { error: "ليس لديك صلاحية حذف عناصر المكتبة." };
    const result = type === "exercise" ? await supabase.from("exercise_library").delete().eq("id", id).eq("coach_id", user.id) : await supabase.from("meal_library").delete().eq("id", id).eq("coach_id", user.id);
    if (result.error) return { error: "لا يمكن حذف عنصر مستخدم في خطة حالية." };
    revalidatePath("/coach/library");
    return { success: "تم حذف العنصر." };
  } catch (error) {
    console.error("deleteLibraryItem failed", error instanceof Error ? error.message : "unknown error");
    return { error: "حدث خطأ أثناء الحذف. حاول مرة أخرى." };
  }
}
