"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type PlanItemInput = {
  libraryItemId?: string;
  mealLabel?: string;
  overrideGrams?: string;
  dayOfWeek: number;
  orderIndex: number;
  name: string;
  sets?: string;
  reps?: string;
  restSeconds?: string;
  calories?: string;
};

export type PlanInput = {
  id?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  items: PlanItemInput[];
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function integerOrNull(value?: string, minimum = 0) {
  if (!value?.trim()) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum ? number : null;
}

function numberOrNull(value?: string) {
  if (!value?.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function validateDateRange(plan: PlanInput) {
  const start = plan.startDate?.trim() || null;
  const end = plan.endDate?.trim() || null;
  if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) return false;
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) return false;
  return !start || !end || end >= start;
}

function preparePlan(plan: PlanInput, type: "workout" | "diet") {
  if (plan.id && !uuidPattern.test(plan.id)) throw new Error("معرّف الخطة غير صحيح.");
  if (plan.title.trim().length > 160) throw new Error("عنوان الخطة طويل جدًا.");
  if (!validateDateRange(plan)) throw new Error("تواريخ الخطة غير صحيحة.");

  const items = plan.items.filter((item) => item.name.trim());
  const preparedItems = items.map((item, index) => {
    if (!Number.isInteger(item.dayOfWeek) || item.dayOfWeek < 0 || item.dayOfWeek > 6) throw new Error("يوم الخطة غير صحيح.");
    if (item.libraryItemId && !uuidPattern.test(item.libraryItemId)) throw new Error("عنصر المكتبة غير صحيح.");

    if (type === "diet") {
      const grams = numberOrNull(item.overrideGrams);
      if (!grams || !item.mealLabel?.trim()) throw new Error("يجب إدخال الوجبة والكمية بالجرام.");
      return {
        library_item_id: item.libraryItemId || null,
        meal_label: item.mealLabel.trim().slice(0, 80),
        override_grams: grams,
        day_of_week: item.dayOfWeek,
        order_index: index,
        name: item.name.trim().slice(0, 160),
        override_sets: null,
        override_reps: null,
        override_calories: integerOrNull(item.calories),
        details: {},
      };
    }

    return {
      library_item_id: item.libraryItemId || null,
      meal_label: null,
      override_grams: null,
      day_of_week: item.dayOfWeek,
      order_index: index,
      name: item.name.trim().slice(0, 160),
      override_sets: integerOrNull(item.sets, 1),
      override_reps: item.reps?.trim().slice(0, 40) || null,
      override_calories: null,
      details: { rest_seconds: integerOrNull(item.restSeconds, 0) },
    };
  });

  return {
    id: plan.id || null,
    title: plan.title.trim().slice(0, 160),
    start_date: plan.startDate?.trim() || null,
    end_date: plan.endDate?.trim() || null,
    items: preparedItems,
  };
}

export async function savePlans(clientId: string, workout: PlanInput, diet: PlanInput) {
  try {
    if (!uuidPattern.test(clientId)) return { error: "معرّف العميل غير صحيح." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "يجب تسجيل الدخول أولًا." };

    const { data: coachProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (coachProfile?.role !== "coach") return { error: "ليست لديك صلاحية تعديل الخطط." };

    const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("coach_id", user.id).maybeSingle();
    if (!client) return { error: "العميل غير موجود أو لا تملك صلاحية الوصول إليه." };

    const workoutPayload = preparePlan(workout, "workout");
    const dietPayload = preparePlan(diet, "diet");
    const { error } = await supabase.rpc("save_client_plans", {
      p_client_id: clientId,
      p_workout: workoutPayload,
      p_diet: dietPayload,
    });

    if (error) {
      console.error("save_client_plans failed", { code: error.code, message: error.message });
      return { error: "تعذر حفظ الخطط. راجع البيانات وحاول مرة أخرى." };
    }

    revalidatePath(`/coach/clients/${clientId}`);
    revalidatePath("/dashboard");
    return { success: "تم حفظ الخطط بنجاح." };
  } catch (error) {
    console.error("savePlans failed", error);
    return { error: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الخطط." };
  }
}
