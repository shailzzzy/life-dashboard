"use client";

import { useState } from "react";
import { DashboardData, NutritionEntry } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

export default function NutritionLog({ data, update }: Props) {
  const [text, setText] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const entries = data.nutritionLog.filter((e) => e.date === today);
  const totalKcal = entries.reduce((s, e) => s + e.kcal, 0);

  function parseAndAdd() {
    if (!text.trim()) return;
    // naive: pull a trailing number as kcal if present, else 0
    const match = text.match(/(\d+)\s*kcal/i);
    const kcal = match ? Number(match[1]) : 0;
    const entry: NutritionEntry = {
      id: crypto.randomUUID(),
      date: today,
      text: text.trim(),
      kcal,
    };
    update((d) => ({ ...d, nutritionLog: [...d.nutritionLog, entry] }));
    setText("");
  }

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">08 // Nutrition</span>
        <span className="tile-sub">TODAY</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl mono">{totalKcal}</span>
        <span className="tag">kcal today</span>
      </div>
      <div className="tag mt-1">Goal: {data.nutritionGoalKcal} kcal</div>

      <div className="mt-3 space-y-1">
        {entries.length === 0 && <div className="tile-sub">No meals logged yet.</div>}
        {entries.map((e) => (
          <div key={e.id} className="text-xs flex justify-between">
            <span>{e.text}</span>
            {e.kcal > 0 && <span className="tag">{e.kcal} kcal</span>}
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={(ev) => setText(ev.target.value)}
        onKeyDown={(ev) => ev.key === "Enter" && parseAndAdd()}
        placeholder='Log a meal — e.g. "chicken, rice, broccoli, 550 kcal"'
        className="os-input mt-3 text-xs"
      />
    </div>
  );
}
