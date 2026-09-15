"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePlans } from "@/app/actions/plans";

type LibraryItem = { id: string; name: string; youtube_url?: string | null; default_sets?: number | null; default_reps?: string | null; default_rest_seconds?: number | null; calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fats_g?: number | null; macro_reference_grams?: number | null };
export type BuilderItem = { dayOfWeek: number; orderIndex: number; name: string; libraryItemId?: string; mealLabel?: string; overrideGrams?: string; sets: string; reps: string; restSeconds: string; calories: string; proteinG: string; carbsG: string; fatsG: string };
type Item = BuilderItem;
type Plan = { id?: string; title: string; startDate: string; endDate: string; items: Item[] };

function scaledMacro(value: number | null | undefined, referenceGrams: number | null | undefined, grams: string | undefined) {
  const target = Number(grams);
  if (value == null || !referenceGrams || !Number.isFinite(target) || target <= 0) return "—";
  return (value * target / referenceGrams).toFixed(1).replace(/\.0$/, "");
}

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const empty = (dayOfWeek: number): Item => ({ dayOfWeek, orderIndex: 0, name: "", mealLabel: "الإفطار", overrideGrams: "", sets: "", reps: "", restSeconds: "", calories: "", proteinG: "", carbsG: "", fatsG: "" });

export function LibraryPlanBuilder({ clientId, initialWorkout, initialDiet, exercises, meals }: { clientId: string; initialWorkout: Plan; initialDiet: Plan; exercises: LibraryItem[]; meals: LibraryItem[] }) {
  const [workout, setWorkout] = useState(initialWorkout);
  const [diet, setDiet] = useState(initialDiet);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const update = (type: "workout" | "diet", fn: (plan: Plan) => Plan) => type === "workout" ? setWorkout(fn) : setDiet(fn);
  const add = (type: "workout" | "diet", day: number, library?: LibraryItem) => update(type, (plan) => ({ ...plan, items: [...plan.items, { ...empty(day), name: library?.name ?? "", libraryItemId: library?.id, sets: library?.default_sets?.toString() ?? "", reps: library?.default_reps ?? "", restSeconds: library?.default_rest_seconds?.toString() ?? "", calories: library?.calories?.toString() ?? "", proteinG: library?.protein_g?.toString() ?? "", carbsG: library?.carbs_g?.toString() ?? "", fatsG: library?.fats_g?.toString() ?? "" }] }));
  const change = (type: "workout" | "diet", index: number, key: keyof Item, value: string) => update(type, (plan) => ({ ...plan, items: plan.items.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  const remove = (type: "workout" | "diet", index: number) => update(type, (plan) => ({ ...plan, items: plan.items.filter((_, i) => i !== index) }));
  const save = () => startTransition(async () => { const result = await savePlans(clientId, workout, diet); setMessage(result.error ?? result.success ?? ""); if (result.success) toast.success(result.success); if (result.error) toast.error(result.error); });

  const render = (type: "workout" | "diet", plan: Plan, library: LibraryItem[]) => <section className="plan-builder-section mt-8 rounded-xl border border-white/10 bg-slate-900 p-4 sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row"><input value={plan.title} onChange={(e) => update(type, (p) => ({ ...p, title: e.target.value }))} className="min-h-11 flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2" /><input type="date" value={plan.startDate} onChange={(e) => update(type, (p) => ({ ...p, startDate: e.target.value }))} className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 py-2" /><input type="date" value={plan.endDate} onChange={(e) => update(type, (p) => ({ ...p, endDate: e.target.value }))} className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 py-2" /></div>
    {days.map((day, d) => <div key={day} className="plan-day-card mt-6 rounded-lg border border-white/10 bg-slate-950/50 p-3 pt-4 sm:p-4"><h3 className="font-bold text-lime-300">{day}</h3>
      {plan.items.filter((i) => i.dayOfWeek === d).map((item) => { const index = plan.items.indexOf(item); const selectedMeal = type === "diet" ? library.find((entry) => entry.id === item.libraryItemId) : null; return <div key={`${index}-${item.name}`} className="plan-item-card mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><select value={item.libraryItemId ?? "custom"} onChange={(e) => { const selected = library.find((x) => x.id === e.target.value); if (e.target.value === "custom") { change(type, index, "libraryItemId", ""); return; } if (selected) { add(type, d, selected); remove(type, index); } }} className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"><option value="custom">عنصر مخصص: {item.name || "اكتب الاسم أدناه"}</option>{library.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><input value={item.name} onChange={(e) => change(type, index, "name", e.target.value)} placeholder={type === "diet" ? "اسم الوجبة" : "اسم التمرين"} className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" />{type === "diet" && <input value={item.mealLabel ?? ""} onChange={(e) => change(type, index, "mealLabel", e.target.value)} placeholder="القسم: الإفطار، الغداء..." className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" />}</div>
        {type === "workout" ? <div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={item.sets} onChange={(e) => change(type, index, "sets", e.target.value)} placeholder="مجموعات" className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" /><input value={item.reps} onChange={(e) => change(type, index, "reps", e.target.value)} placeholder="تكرارات" className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" /><input value={item.restSeconds} onChange={(e) => change(type, index, "restSeconds", e.target.value)} placeholder="راحة بالثواني" className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" /></div> : <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]"><label className="relative"><input required type="number" min="1" value={item.overrideGrams ?? ""} onChange={(e) => change(type, index, "overrideGrams", e.target.value)} placeholder="كمية الوجبة بالجرام" className="w-full rounded border border-lime-400/60 bg-slate-900 px-2 py-2 pe-16 text-sm" /><span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-bold text-lime-300">جرام</span></label>{selectedMeal && <div className="self-center text-xs leading-6 text-slate-400"><p className="text-lime-300">مرجع المدرب فقط — القيم لكل {selectedMeal.macro_reference_grams ?? 100} جرام</p><p>للكمية الحالية: {scaledMacro(selectedMeal.calories, selectedMeal.macro_reference_grams, item.overrideGrams)} سعر · بروتين {scaledMacro(selectedMeal.protein_g, selectedMeal.macro_reference_grams, item.overrideGrams)}ج · كربوهيدرات {scaledMacro(selectedMeal.carbs_g, selectedMeal.macro_reference_grams, item.overrideGrams)}ج · دهون {scaledMacro(selectedMeal.fats_g, selectedMeal.macro_reference_grams, item.overrideGrams)}ج</p></div>}</div>}
        <button type="button" onClick={() => remove(type, index)} className="mt-2 rounded border border-red-900 px-2 py-2 text-sm text-red-300">حذف</button>
      </div>; })}
      <button type="button" onClick={() => add(type, d)} className="mt-3 rounded border border-slate-600 px-3 py-2 text-sm text-slate-300">+ إضافة من المكتبة أو عنصر مخصص</button>
    </div>)}
  </section>;

  return <div>{render("workout", workout, exercises)}{render("diet", diet, meals)}<div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"><button type="button" onClick={save} disabled={pending} className="min-h-11 rounded bg-lime-400 px-6 py-3 font-bold text-slate-950 sm:w-auto">{pending ? "جار الحفظ..." : "حفظ الخطط"}</button>{message && <span className="text-sm text-lime-300">{message}</span>}</div></div>;
}
