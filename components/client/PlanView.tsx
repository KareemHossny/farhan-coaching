"use client";

import { useState } from "react";
import { ChevronDown, Dumbbell, Utensils } from "lucide-react";
import { YoutubeEmbed } from "@/components/YoutubeEmbed";

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

export type ClientPlanItem = {
  plan_id: string; client_id: string; plan_type: "workout" | "diet"; plan_title: string;
  start_date: string | null; end_date: string | null; item_id: string; day_of_week: number;
  order_index: number; library_item_id: string | null; meal_label: string | null;
  alternative_group: string | null; item_name: string | null; grams: number | null; sets: number | null; reps: string | null;
  rest_seconds: number | null; youtube_url: string | null;
};

export type ClientPlan = { id: string; type: "workout" | "diet"; title: string; plan_items: ClientPlanItem[] };

function WorkoutItem({ item }: { item: ClientPlanItem }) {
  return <div className="client-plan-item"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Dumbbell size={17} /></span><div className="min-w-0"><p className="break-words font-extrabold">{item.item_name ?? "تمرين في الخطة"}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{item.sets ?? "—"} مجموعات · {item.reps ?? "—"} تكرارات · راحة {item.rest_seconds ?? "—"} ثانية</p></div></div>{item.youtube_url && <details className="mt-3 border-t border-[var(--border-hairline)] pt-3"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-bold text-[var(--accent)]">مشاهدة فيديو التمرين <ChevronDown size={16} /></summary><div className="mt-2"><YoutubeEmbed youtubeUrl={item.youtube_url} /></div></details>}</div>;
}

function DietGroup({ items }: { items: ClientPlanItem[] }) {
  const meals = new Map<string, ClientPlanItem[]>();
  [...items].sort((a, b) => a.order_index - b.order_index).forEach((item) => { const label = item.meal_label?.trim() || "وجبة"; meals.set(label, [...(meals.get(label) ?? []), item]); });
  return <div className="mt-4 space-y-5">{[...meals.entries()].map(([label, mealItems]) => {
    const options = new Map<string, ClientPlanItem[]>();
    mealItems.forEach((item) => { const key = item.alternative_group ? `alternative:${item.alternative_group}` : `item:${item.item_id}`; options.set(key, [...(options.get(key) ?? []), item]); });
    return <div key={label}><div className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-2"><Utensils size={15} className="text-[var(--accent)]" /><h4 className="text-sm font-extrabold text-[var(--accent)]">{label}</h4></div><div className="mt-2 space-y-2">{[...options.values()].map((option, optionIndex) => <div key={`${label}-${optionIndex}`} className="space-y-2">{option.map((item, itemIndex) => <div key={item.item_id}><div className="client-plan-item flex items-center justify-between gap-4"><p className="break-words font-extrabold">{item.item_name ?? "وجبة في الخطة"}</p><span className="shrink-0 rounded-full bg-[rgb(226,253,75,0.1)] px-3 py-1 text-sm font-black text-[var(--accent)]">{item.grams ?? "—"} جرام</span></div>{option.length > 1 && itemIndex < option.length - 1 && <p className="py-1 text-center text-xs font-black text-[var(--accent)]">أو</p>}</div>)}</div>)}</div></div>;
  })}</div>;
}

function PlanSection({ title, plan, type, today, icon: Icon }: { title: string; plan?: ClientPlan; type: "workout" | "diet"; today: number; icon: typeof Dumbbell }) {
  const [selectedDay, setSelectedDay] = useState(today);
  const items = plan?.plan_items.filter((item) => type === "diet" || item.day_of_week === selectedDay).sort((a, b) => a.order_index - b.order_index) ?? [];
  return <section className="client-plan-section panel p-4 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{title}</p><h2 className="mt-2 text-2xl font-black">{plan?.title ?? `لا توجد ${title} حالية`}</h2></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgb(226,253,75,0.1)] text-[var(--accent)]"><Icon size={19} /></span></div>{plan ? type === "diet" ? <div className="mt-6 rounded-[var(--radius-base)] border border-[var(--border-hairline)] bg-[var(--bg-ink)] p-3 sm:p-4"><p className="text-sm text-[var(--text-muted)]">وجباتك ثابتة لكل أيام الأسبوع — اختر بديلًا واحدًا عند وجود «أو».</p>{items.length ? <DietGroup items={items} /> : <p className="py-8 text-center text-sm text-[var(--text-muted)]">لم يضف الكابتن وجبات بعد.</p>}</div> : <><div className="day-picker mt-6" role="tablist" aria-label={`اختيار يوم ${title}`}>{days.map((day, index) => <button key={day} type="button" role="tab" aria-selected={selectedDay === index} onClick={() => setSelectedDay(index)} className={`day-picker-button ${selectedDay === index ? "day-picker-button-active" : ""}`}>{index === today && <span className="day-picker-dot" />}{day}</button>)}</div><div className="mt-5 rounded-[var(--radius-base)] border border-[var(--border-hairline)] bg-[var(--bg-ink)] p-3 sm:p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-[var(--accent)]">{days[selectedDay]}</h3>{selectedDay === today && <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-black text-[var(--bg-ink)]">اليوم</span>}</div>{items.length ? <div className="mt-3 space-y-2">{items.map((item) => <WorkoutItem key={item.item_id} item={item} />)}</div> : <p className="py-8 text-center text-sm text-[var(--text-muted)]">لا توجد عناصر لهذا اليوم.</p>}</div></> : <div className="mt-6 border border-dashed border-[var(--border-hairline)] p-8 text-center text-sm text-[var(--text-muted)]">لم يضف الكابتن {title} بعد.</div>}</section>;
}

export function PlanView({ workout, diet, today, section = "all" }: { workout?: ClientPlan; diet?: ClientPlan; today: number; section?: "all" | "workout" | "diet" }) {
  return <div className="space-y-5">{section !== "diet" && <PlanSection title="خطة التمرين" plan={workout} type="workout" today={today} icon={Dumbbell} />}{section !== "workout" && <PlanSection title="خطة التغذية" plan={diet} type="diet" today={today} icon={Utensils} />}</div>;
}
