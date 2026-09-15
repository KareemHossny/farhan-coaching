"use client";

export default function ClientDashboardError({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white"><div><h1 className="text-2xl font-bold">تعذر تحميل لوحة العميل</h1><p className="mt-3 text-slate-400">حدث خطأ مؤقت. حاول تحديث الصفحة.</p><button onClick={reset} className="mt-6 rounded-md bg-lime-400 px-5 py-3 font-bold text-slate-950">إعادة المحاولة</button></div></main>;
}
