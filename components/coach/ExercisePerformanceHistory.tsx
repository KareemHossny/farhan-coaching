type Performance = { exercise_name: string; date: string; max_weight_kg: number; max_reps: number };

export function ExercisePerformanceHistory({ logs }: { logs: Performance[] }) {
  return (
    <section className="mt-5 rounded-xl border border-white/10 bg-slate-900 p-4 sm:p-6" aria-labelledby="exercise-performance-history-heading">
      <div className="mb-5">
        <h2 id="exercise-performance-history-heading" className="text-xl font-bold">أداء التمارين</h2>
        <p className="mt-1 text-sm text-slate-400">أقصى وزن وأعلى عدات سجّلها العميل لكل تمرين.</p>
      </div>
      {logs.length ? <div className="space-y-3">{logs.map((log, index) => <div key={`${log.date}-${log.exercise_name}-${index}`} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{log.exercise_name}</p><time className="mt-1 block text-xs text-slate-400" dateTime={log.date}>{new Date(`${log.date}T00:00:00`).toLocaleDateString("ar-EG")}</time></div><div className="flex gap-2 text-sm"><span className="rounded-full bg-lime-300/10 px-3 py-1 font-bold text-lime-300">{log.max_weight_kg} كجم</span><span className="rounded-full bg-white/10 px-3 py-1 font-bold text-white">{log.max_reps} عدة</span></div></div>)}</div> : <p className="rounded-lg border border-dashed border-white/10 p-7 text-center text-sm text-slate-400">لم يسجل العميل أداء التمارين بعد.</p>}
    </section>
  );
}
