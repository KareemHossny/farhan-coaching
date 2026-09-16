"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ExercisePerformanceActionState = { error?: string; success?: string };

export async function saveExercisePerformance(
  _previous: ExercisePerformanceActionState,
  formData: FormData,
): Promise<ExercisePerformanceActionState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول أولًا." };

    const planItemId = String(formData.get("plan_item_id") ?? "").trim();
    const maxWeight = Number(formData.get("max_weight_kg"));
    const maxReps = Number(formData.get("max_reps"));
    if (!planItemId || !/^[0-9a-f-]{36}$/i.test(planItemId)) return { error: "التمرين غير صالح." };
    if (!Number.isFinite(maxWeight) || maxWeight < 0 || maxWeight > 1000) return { error: "اكتب أقصى وزن صحيحًا." };
    if (!Number.isInteger(maxReps) || maxReps < 1 || maxReps > 1000) return { error: "اكتب أعلى عدد عدات صحيحًا." };

    const { error } = await supabase.from("exercise_performance_records").upsert(
      {
        client_id: user.id,
        plan_item_id: planItemId,
        exercise_key: "",
        exercise_name: "",
        max_weight_kg: maxWeight,
        max_reps: maxReps,
      },
      { onConflict: "client_id,exercise_key" },
    );

    if (error) {
      console.error("saveExercisePerformance failed", { code: error.code, message: error.message });
      return { error: "تعذر حفظ أداء التمرين. تأكد من تطبيق migration 0013 ثم حاول مرة أخرى." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/coach/clients", "page");
    return { success: "تم حفظ أداء التمرين." };
  } catch (error) {
    console.error("saveExercisePerformance unexpected error", error);
    return { error: "حدث خطأ أثناء حفظ أداء التمرين. حاول مرة أخرى." };
  }
}
