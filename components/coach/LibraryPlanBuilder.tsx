"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePlans } from "@/app/actions/plans";

type LibraryItem = { id: string; name: string; default_sets?: number | null; default_reps?: string | null; default_rest_seconds?: number | null; calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fats_g?: number | null; macro_reference_grams?: number | null };
export type BuilderItem = { dayOfWeek: number; orderIndex: number; name: string; libraryItemId?: string; mealLabel?: string; alternativeGroup?: string; overrideGrams?: string; sets: string; reps: string; restSeconds: string; calories: string; proteinG: string; carbsG: string; fatsG: string };
type Plan = { id?: string; title: string; startDate: string; endDate: string; items: BuilderItem[] };

function scaledMacro(value: number | null | undefined, referenceGrams: number | null | undefined, grams: string | undefined) {
  const target = Number(grams);
  if (value == null || !referenceGrams || !Number.isFinite(target) || target <= 0) return "—";
  return (value * target / referenceGrams).toFixed(1).replace(/\.0$/, "");
}

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const empty = (dayOfWeek = 0, mealLabel = "الوجبة 1", alternativeGroup?: string): BuilderItem => ({ dayOfWeek, orderIndex: 0, name: "", mealLabel, alternativeGroup, overrideGrams: "", sets: "", reps: "", restSeconds: "", calories: "", proteinG: "", carbsG: "", fatsG: "" });

function newAlternativeGroup(index: number) {
  return `alternative-${index}-${Date.now()}`;
}

export function LibraryPlanBuilder({ clientId, initialWorkout, initialDiet, exercises, meals }: { clientId: string; initialWorkout: Plan; initialDiet: Plan; exercises: LibraryItem[]; meals: LibraryItem[] }) {
  const [workout, setWorkout] = useState(initialWorkout);
  const [diet, setDiet] = useState(initialDiet);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const update = (type: "workout" | "diet", fn: (plan: Plan) => Plan) => type === "workout" ? setWorkout(fn) : setDiet(fn);
  const add = (type: "workout" | "diet", day = 0, library?: LibraryItem, mealLabel = "الوجبة 1", alternativeGroup?: string) => update(type, (plan) => ({ ...plan, items: [...plan.items, { ...empty(day, mealLabel, alternativeGroup), orderIndex: plan.items.length, name: library?.name ?? "", libraryItemId: library?.id, sets: library?.default_sets?.toString() ?? "", reps: library?.default_reps ?? "", restSeconds: library?.default_rest_seconds?.toString() ?? "", calories: library?.calories?.toString() ?? "", proteinG: library?.protein_g?.toString() ?? "", carbsG: library?.carbs_g?.toString() ?? "", fatsG: library?.fats_g?.toString() ?? "" }] }));
  const change = (type: "workout" | "diet", index: number, key: keyof BuilderItem, value: string) => update(type, (plan) => ({ ...plan, items: plan.items.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  const remove = (type: "workout" | "diet", index: number) => update(type, (plan) => ({ ...plan, items: plan.items.filter((_, i) => i !== index) }));
  const selectLibrary = (type: "workout" | "diet", index: number, library: LibraryItem[], value: string) => {
    const selected = library.find((item) => item.id === value);
    update(type, (plan) => ({
      ...plan,
      items: plan.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (!selected) return { ...item, libraryItemId: undefined };
        return { ...item, name: selected.name, libraryItemId: selected.id, sets: selected.default_sets?.toString() ?? item.sets, reps: selected.default_reps ?? item.reps, restSeconds: selected.default_rest_seconds?.toString() ?? item.restSeconds, calories: selected.calories?.toString() ?? item.calories, proteinG: selected.protein_g?.toString() ?? item.proteinG, carbsG: selected.carbs_g?.toString() ?? item.carbsG, fatsG: selected.fats_g?.toString() ?? item.fatsG };
      }),
    }));
  };
  const renameMeal = (oldLabel: string, value: string) => update("diet", (plan) => ({ ...plan, items: plan.items.map((item) => item.mealLabel === oldLabel ? { ...item, mealLabel: value } : item) }));
  const addAlternative = (index: number, item: BuilderItem) => update("diet", (plan) => {
    const group = item.alternativeGroup ?? newAlternativeGroup(index);
    const items = plan.items.map((current, itemIndex) => itemIndex === index ? { ...current, alternativeGroup: group } : current);
    return { ...plan, items: [...items, { ...empty(0, item.mealLabel || "الوجبة 1", group), orderIndex: items.length }] };
  });
  const save = () => startTransition(async () => { const result = await savePlans(clientId, workout, diet); setMessage(result.error ?? result.success ?? ""); if (result.success) toast.success(result.success); if (result.error) toast.error(result.error); });

  const fields = (type: "workout" | "diet", item: BuilderItem, index: number, library: LibraryItem[]) => {
    const selectedMeal = type === "diet" ? library.find((entry) => entry.id === item.libraryItemId) : null;
    return <>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><select value={item.libraryItemId ?? "custom"} onChange={(event) => selectLibrary(type, index, library, event.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"><option value="custom">عنصر مخصص: {item.name || "اكتب الاسم أدناه"}</option>{library.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select><input value={item.name} onChange={(event) => change(type, index, "name", event.target.value)} placeholder={type === "diet" ? "اسم الطعام" : "اسم التمرين"} className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" /><button type="button" onClick={() => remove(type, index)} className="rounded border border-red-900 px-2 py-2 text-sm text-red-300">حذف</button></div>
      {type === "workout" ? <div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={item.sets} onChange={(event) => change(type, index, "sets", event.target.value)} placeholder="مجموعات" className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" /><input value={item.reps} onChange={(event) => change(type, index, "reps", event.target.value)} placeholder="تكرارات" className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" /><input value={item.restSeconds} onChange={(event) => change(type, index, "restSeconds", event.target.value)} placeholder="راحة بالثواني" className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" /></div> : <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start"><label className="relative"><input required type="number" min="1" value={item.overrideGrams ?? ""} onChange={(event) => change(type, index, "overrideGrams", event.target.value)} placeholder="كمية الطعام بالجرام" className="w-full rounded border border-lime-400/60 bg-slate-900 px-2 py-2 pe-16 text-sm" /><span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-bold text-lime-300">جرام</span></label>{selectedMeal && <div className="text-xs leading-6 text-slate-400"><p className="text-lime-300">مرجع المدرب فقط — القيم لكل {selectedMeal.macro_reference_grams ?? 100} جرام</p><p>للكمية الحالية: {scaledMacro(selectedMeal.calories, selectedMeal.macro_reference_grams, item.overrideGrams)} سعر · بروتين {scaledMacro(selectedMeal.protein_g, selectedMeal.macro_reference_grams, item.overrideGrams)}ج · كربوهيدرات {scaledMacro(selectedMeal.carbs_g, selectedMeal.macro_reference_grams, item.overrideGrams)}ج · دهون {scaledMacro(selectedMeal.fats_g, selectedMeal.macro_reference_grams, item.overrideGrams)}ج</p></div>}</div>}
    </>;
  };

  const renderWorkout = () => <section className="plan-builder-section mt-8 rounded-xl border border-white/10 bg-slate-900 p-4 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row"><input value={workout.title} onChange={(event) => setWorkout((plan) => ({ ...plan, title: event.target.value }))} className="min-h-11 flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2" /><input type="date" value={workout.startDate} onChange={(event) => setWorkout((plan) => ({ ...plan, startDate: event.target.value }))} className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 py-2" /><input type="date" value={workout.endDate} onChange={(event) => setWorkout((plan) => ({ ...plan, endDate: event.target.value }))} className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 py-2" /></div>{days.map((day, dayIndex) => <div key={day} className="plan-day-card mt-6 rounded-lg border border-white/10 bg-slate-950/50 p-3 pt-4 sm:p-4"><h3 className="font-bold text-lime-300">{day}</h3>{workout.items.filter((item) => item.dayOfWeek === dayIndex).map((item) => { const index = workout.items.indexOf(item); return <div key={`${index}-${item.name}`} className="plan-item-card mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3">{fields("workout", item, index, exercises)}</div>; })}<button type="button" onClick={() => add("workout", dayIndex)} className="mt-3 rounded border border-slate-600 px-3 py-2 text-sm text-slate-300">+ إضافة تمرين</button></div>)}</section>;

  const renderDiet = () => {
    const mealsByLabel = [...new Set(diet.items.map((item) => item.mealLabel?.trim() || "الوجبة 1"))];
    return <section className="plan-builder-section mt-8 rounded-xl border border-lime-400/30 bg-slate-900 p-4 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row"><input value={diet.title} onChange={(event) => setDiet((plan) => ({ ...plan, title: event.target.value }))} className="min-h-11 flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2" /><input type="date" value={diet.startDate} onChange={(event) => setDiet((plan) => ({ ...plan, startDate: event.target.value }))} className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 py-2" /><input type="date" value={diet.endDate} onChange={(event) => setDiet((plan) => ({ ...plan, endDate: event.target.value }))} className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 py-2" /></div><p className="mt-5 text-sm leading-7 text-slate-400">خطة التغذية ثابتة لكل الأيام. أضف الوجبة 1 والوجبة 2 وهكذا، ويمكنك إضافة بديل باستخدام «أو» داخل أي وجبة.</p>{mealsByLabel.map((label, mealIndex) => { const mealItems = diet.items.filter((item) => (item.mealLabel?.trim() || "الوجبة 1") === label); const alternativeGroups = new Map<string, BuilderItem[]>(); mealItems.forEach((item) => { const key = item.alternativeGroup ? `alternative:${item.alternativeGroup}` : `item:${diet.items.indexOf(item)}`; alternativeGroups.set(key, [...(alternativeGroups.get(key) ?? []), item]); }); return <div key={`${label}-${mealIndex}`} className="plan-day-card mt-6 rounded-lg border border-white/10 bg-slate-950/50 p-3 pt-4 sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><input value={label} onChange={(event) => renameMeal(label, event.target.value)} className="min-h-11 rounded border border-lime-400/50 bg-slate-900 px-3 py-2 font-bold text-lime-300" aria-label={`اسم الوجبة ${mealIndex + 1}`} /><button type="button" onClick={() => add("diet", 0, undefined, label)} className="rounded border border-slate-600 px-3 py-2 text-sm text-slate-300">+ إضافة طعام</button></div>{[...alternativeGroups.values()].map((group, groupIndex) => <div key={`${label}-${groupIndex}`} className="mt-3">{group.length > 1 && <p className="mb-2 text-center text-xs font-black text-lime-300">أو — اختر بديلًا واحدًا</p>}{group.map((item, optionIndex) => { const index = diet.items.indexOf(item); return <div key={`${index}-${item.name}`} className="plan-item-card rounded-lg border border-slate-700 bg-slate-950 p-3">{fields("diet", item, index, meals)}{group.length === 1 && <button type="button" onClick={() => addAlternative(index, item)} className="mt-3 rounded border border-lime-400/40 px-3 py-2 text-xs font-bold text-lime-300">+ إضافة بديل «أو»</button>}{group.length > 1 && optionIndex < group.length - 1 && <div className="pt-3 text-center text-xs font-black text-lime-300">أو</div>}</div>; })}</div>)}<button type="button" onClick={() => add("diet", 0, undefined, `الوجبة ${mealsByLabel.length + 1}`)} className="mt-4 rounded border border-lime-400/50 px-3 py-2 text-sm font-bold text-lime-300">+ إضافة وجبة جديدة</button></div>; })}{!mealsByLabel.length && <button type="button" onClick={() => add("diet", 0, undefined, "الوجبة 1")} className="mt-6 rounded border border-lime-400/50 px-3 py-2 text-sm font-bold text-lime-300">+ إضافة الوجبة 1</button>}</section>;
  };

  return <div>{renderWorkout()}{renderDiet()}<div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"><button type="button" onClick={save} disabled={pending} className="min-h-11 rounded bg-lime-400 px-6 py-3 font-bold text-slate-950 sm:w-auto">{pending ? "جار الحفظ..." : "حفظ الخطط"}</button>{message && <span className="text-sm text-lime-300">{message}</span>}</div></div>;
}
