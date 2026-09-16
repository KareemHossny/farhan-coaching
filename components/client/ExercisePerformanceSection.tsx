"use client";

import { useState } from "react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveExercisePerformance, type ExercisePerformanceActionState } from "@/app/actions/exercise-performance";
import type { ClientPlanItem } from "@/components/client/PlanView";

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

export type ExercisePerformanceLog = {
  plan_item_id: string | null;
  date: string;
  max_weight_kg: number;
  max_reps: number;
};

function PerformanceForm({ item, log }: { item: ClientPlanItem; log?: ExercisePerformanceLog }) {
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

export function ExercisePerformanceSection({ items, logs, today }: { items: ClientPlanItem[]; logs: ExercisePerformanceLog[]; today: number }) {
  const [selectedDay, setSelectedDay] = useState(today);
  const dayItems = items.filter((item) => item.day_of_week === selectedDay).sort((a, b) => a.order_index - b.order_index);
  const logByItem = new Map(logs.filter((log) => log.plan_item_id).map((log) => [log.plan_item_id, log]));

  return (
    <section className="panel mt-5 p-5 sm:p-7" aria-labelledby="exercise-performance-heading">
      <p className="eyebrow">متابعة الأداء</p>
      <h2 id="exercise-performance-heading" className="mt-2 text-2xl font-black">سجّل أقوى أداء ليك</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">اكتب أقصى وزن وأعلى عدات حققتهم في كل تمرين، والكابتن هيقدر يتابع تقدمك.</p>
      <div className="day-picker mt-5" role="tablist" aria-label="اختيار يوم التمرين">
        {days.map((day, index) => <button key={day} type="button" role="tab" aria-selected={selectedDay === index} onClick={() => setSelectedDay(index)} className={`day-picker-button ${selectedDay === index ? "day-picker-button-active" : ""}`}>{index === today && <span className="day-picker-dot" />}{day}</button>)}
      </div>
      {dayItems.length ? <div className="mt-4 space-y-3">{dayItems.map((item) => <PerformanceForm key={item.item_id} item={item} log={logByItem.get(item.item_id)} />)}</div> : <p className="mt-5 rounded-[var(--radius-base)] border border-dashed border-[var(--border-hairline)] p-6 text-center text-sm text-[var(--text-muted)]">لا توجد تمارين مضافة لهذا اليوم.</p>}
    </section>
  );
}
