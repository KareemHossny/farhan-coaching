"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveExercisePerformance, type ExercisePerformanceActionState } from "@/app/actions/exercise-performance";
import type { ClientPlanItem } from "@/components/client/PlanView";

export type ExercisePerformanceRecord = {
  plan_item_id: string | null;
  exercise_key: string;
  max_weight_kg: number;
  max_reps: number;
};

function exerciseKey(item: ClientPlanItem) {
  return item.library_item_id ? `library:${item.library_item_id}` : `custom:${(item.item_name ?? "").trim().toLowerCase()}`;
}

function PerformanceForm({ item, log }: { item: ClientPlanItem; log?: ExercisePerformanceRecord }) {
  const [state, action, pending] = useActionState<ExercisePerformanceActionState, FormData>(saveExercisePerformance, {});

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state.error, state.success]);

  return (
    <form action={action} className="mt-4 grid gap-3 rounded-[var(--radius-base)] border border-[var(--border-hairline)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_9rem_9rem_auto] sm:items-end">
      <input type="hidden" name="plan_item_id" value={item.item_id} />
      <div>
        <p className="font-extrabold">{item.item_name ?? "تمرين"}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{item.sets ?? "—"} مجموعات · {item.reps ?? "—"} تكرارات</p>
      </div>
      <label className="text-xs font-bold text-[var(--text-muted)]">
        أقصى وزن (كجم)
        <input name="max_weight_kg" type="number" min="0" max="1000" step="0.5" required defaultValue={log?.max_weight_kg ?? ""} className="field mt-1" dir="ltr" />
      </label>
      <label className="text-xs font-bold text-[var(--text-muted)]">
        أعلى عدات
        <input name="max_reps" type="number" min="1" max="1000" step="1" required defaultValue={log?.max_reps ?? ""} className="field mt-1" dir="ltr" />
      </label>
      <button type="submit" disabled={pending} className="cta-button min-h-11 px-4 py-2 text-sm disabled:opacity-50">
        {pending ? "جارٍ الحفظ..." : "حفظ"}
      </button>
      {state.error && <p className="text-xs text-red-300 sm:col-span-4" role="alert">{state.error}</p>}
    </form>
  );
}

export function ExercisePerformanceSection({ items, records }: { items: ClientPlanItem[]; records: ExercisePerformanceRecord[] }) {
  const uniqueItems = [...new Map([...items].sort((a, b) => a.order_index - b.order_index).map((item) => [exerciseKey(item), item])).values()];
  const recordByExercise = new Map(records.map((record) => [record.exercise_key, record]));

  return (
    <section className="panel mt-5 p-5 sm:p-7" aria-labelledby="exercise-performance-heading">
      <p className="eyebrow">متابعة الأداء</p>
      <h2 id="exercise-performance-heading" className="mt-2 text-2xl font-black">سجّل أقوى أداء ليك</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">لكل تمرين سجل واحد فقط. عدّل أقصى وزن أو أعلى عدات في أي وقت، والكابتن سيرى آخر قيمة محفوظة.</p>
      {uniqueItems.length ? <div className="mt-4 space-y-3">{uniqueItems.map((item) => <PerformanceForm key={exerciseKey(item)} item={item} log={recordByExercise.get(exerciseKey(item))} />)}</div> : <p className="mt-5 rounded-[var(--radius-base)] border border-dashed border-[var(--border-hairline)] p-6 text-center text-sm text-[var(--text-muted)]">لم يضف الكابتن تمارين إلى خطتك بعد.</p>}
    </section>
  );
}
