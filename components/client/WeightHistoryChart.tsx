"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WeightHistoryChart({ data }: { data: { date: string; weight: number }[] }) {
  if (!data.length) return <div className="flex h-56 items-center justify-center text-sm text-slate-400">سجل وزنك لتظهر المتابعة هنا.</div>;
  return <div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}><XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} /><YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} domain={["auto", "auto"]} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", direction: "rtl" }} /><Line type="monotone" dataKey="weight" name="الوزن (كجم)" stroke="#bef264" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>;
}
