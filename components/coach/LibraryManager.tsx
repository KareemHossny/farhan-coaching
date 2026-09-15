"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteLibraryItem, saveLibraryItem, type LibraryActionState } from "@/app/actions/library";
import { extractYoutubeId } from "@/lib/youtube";

type LibraryItem = {
  id: string;
  name: string;
  muscle_group?: string | null;
  youtube_url?: string | null;
  default_sets?: number | null;
  default_reps?: string | null;
  default_rest_seconds?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fats_g?: number | null;
  macro_reference_grams?: number | null;
  notes?: string | null;
};

export function LibraryManager({ exercises, meals }: { exercises: LibraryItem[]; meals: LibraryItem[] }) {
  const [tab, setTab] = useState<"exercise" | "meal">("exercise");
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [pending, startTransition] = useTransition();
  const items = tab === "exercise" ? exercises : meals;

  const changeTab = (nextTab: "exercise" | "meal") => {
    setTab(nextTab);
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العنصر؟")) return;
    startTransition(async () => {
      const result = await deleteLibraryItem(tab, id);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  return <div className="mt-8">
    <div className="flex gap-2 overflow-x-auto border-b border-white/10">
      <button type="button" onClick={() => changeTab("exercise")} className={`min-h-11 shrink-0 px-4 py-3 font-bold ${tab === "exercise" ? "border-b-2 border-lime-300 text-lime-300" : "text-slate-400"}`}>التمارين</button>
      <button type="button" onClick={() => changeTab("meal")} className={`min-h-11 shrink-0 px-4 py-3 font-bold ${tab === "meal" ? "border-b-2 border-lime-300 text-lime-300" : "text-slate-400"}`}>الوجبات</button>
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {items.length ? items.map((item) => <div key={item.id} className={`rounded-xl border bg-slate-900 p-4 ${editing?.id === item.id ? "border-lime-300/70" : "border-white/10"}`}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div className="min-w-0"><h2 className="break-words font-bold">{item.name}</h2><p className="mt-1 break-words text-sm text-slate-400">{tab === "exercise" ? `${item.muscle_group ?? "بدون تصنيف"} · ${item.default_sets ?? "—"} مجموعات · ${item.default_reps ?? "—"} تكرارات · ${item.default_rest_seconds ?? "—"} ثانية راحة` : `${item.calories ?? "—"} سعر · بروتين ${item.protein_g ?? "—"}ج · كربوهيدرات ${item.carbs_g ?? "—"}ج · دهون ${item.fats_g ?? "—"}ج · لكل ${item.macro_reference_grams ?? 100} جرام`}</p>{tab === "exercise" && item.youtube_url && <p className="mt-2 break-all text-xs text-lime-300">YouTube: {extractYoutubeId(item.youtube_url)}</p>}</div>
            <div className="flex shrink-0 gap-2"><button type="button" onClick={() => setEditing(item)} disabled={pending} className="inline-flex min-h-11 items-center gap-1 rounded border border-lime-300/50 px-3 py-2 text-sm text-lime-300 hover:bg-lime-300/10 disabled:opacity-50"><Pencil size={15} /> تعديل</button><button type="button" onClick={() => remove(item.id)} disabled={pending} className="min-h-11 rounded border border-red-900 px-3 py-2 text-sm text-red-300 disabled:opacity-50">حذف</button></div>
          </div>
        </div>) : <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">لا توجد عناصر في المكتبة.</div>}
      </div>
      <LibraryForm key={`${tab}-${editing?.id ?? "new"}`} type={tab} initialItem={editing} onCancel={() => setEditing(null)} />
    </div>
  </div>;
}

function LibraryForm({ type, initialItem, onCancel }: { type: "exercise" | "meal"; initialItem: LibraryItem | null; onCancel: () => void }) {
  const [state, action, pending] = useActionState<LibraryActionState, FormData>(saveLibraryItem.bind(null, type), {});
  useEffect(() => { if (state.success) { toast.success(state.success); onCancel(); } if (state.error) toast.error(state.error); }, [onCancel, state.error, state.success]);
  const isEditing = Boolean(initialItem);
  return <form action={action} className="h-fit rounded-xl border border-white/10 bg-slate-900 p-5">
    <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{isEditing ? "تعديل العنصر" : type === "exercise" ? "إضافة تمرين" : "إضافة وجبة"}</h2>{isEditing && <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center gap-1 text-sm text-slate-400 hover:text-white"><X size={16} /> إلغاء</button>}</div>
    {initialItem && <input type="hidden" name="id" value={initialItem.id} />}
    <input name="name" required defaultValue={initialItem?.name ?? ""} placeholder={type === "exercise" ? "اسم التمرين" : "اسم الوجبة"} className="mt-5 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" />
    {type === "exercise" ? <><input name="muscle_group" defaultValue={initialItem?.muscle_group ?? ""} placeholder="المجموعة العضلية" className="mt-3 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" /><input name="youtube_url" defaultValue={initialItem?.youtube_url ?? ""} placeholder="رابط YouTube (اختياري)" dir="ltr" className="mt-3 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-left" /><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"><input name="default_sets" type="number" min="1" defaultValue={initialItem?.default_sets ?? ""} placeholder="مجموعات" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /><input name="default_reps" defaultValue={initialItem?.default_reps ?? ""} placeholder="تكرارات" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /><input name="default_rest_seconds" type="number" min="0" defaultValue={initialItem?.default_rest_seconds ?? ""} placeholder="راحة" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /></div></> : <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-xs text-slate-400">الماكروز محسوبة لكل</span><div className="relative"><input name="macro_reference_grams" required type="number" min="1" step="0.01" defaultValue={initialItem?.macro_reference_grams ?? 100} placeholder="وزن المرجع" className="w-full rounded border border-lime-400/60 bg-slate-950 px-3 py-2 pe-16" /><span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-bold text-lime-300">جرام</span></div></label><input name="calories" type="number" min="0" defaultValue={initialItem?.calories ?? ""} placeholder="السعرات" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /><input name="protein_g" type="number" min="0" step="0.1" defaultValue={initialItem?.protein_g ?? ""} placeholder="بروتين" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /><input name="carbs_g" type="number" min="0" step="0.1" defaultValue={initialItem?.carbs_g ?? ""} placeholder="كربوهيدرات" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /><input name="fats_g" type="number" min="0" step="0.1" defaultValue={initialItem?.fats_g ?? ""} placeholder="دهون" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2" /></div>}
    <textarea name="notes" rows={3} defaultValue={initialItem?.notes ?? ""} placeholder="ملاحظات (اختياري)" className="mt-3 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" />
    <button disabled={pending} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-lime-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60">{isEditing ? <Pencil size={16} /> : <Plus size={16} />}{pending ? "جاري الحفظ..." : isEditing ? "حفظ التعديلات" : "حفظ العنصر"}</button>
  </form>;
}
