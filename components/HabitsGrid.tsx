"use client";

import { useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { DashboardData, CustomHabit } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

function weekDates(): string[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function HabitsGrid({ data, update }: Props) {
  const [managing, setManaging] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const week = weekDates();

  function isDone(habitId: string, date: string) {
    return data.habitLogs.some((l) => l.habitId === habitId && l.date === date);
  }

  function toggle(habitId: string, date: string) {
    update((d) => {
      const exists = d.habitLogs.some((l) => l.habitId === habitId && l.date === date);
      return {
        ...d,
        habitLogs: exists
          ? d.habitLogs.filter((l) => !(l.habitId === habitId && l.date === date))
          : [...d.habitLogs, { habitId, date }],
      };
    });
  }

  function weeklyCount(habitId: string) {
    return week.filter((d) => isDone(habitId, d)).length;
  }

  const totalGoal = data.habits.reduce((s, h) => s + h.goal, 0);
  const totalDone = data.habits.reduce((s, h) => s + Math.min(weeklyCount(h.id), h.goal), 0);
  const pct = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;

  function addHabit() {
    const habit: CustomHabit = { id: crypto.randomUUID(), label: "New habit", icon: "⭐", goal: 5 };
    update((d) => ({ ...d, habits: [...d.habits, habit] }));
  }
  function updateHabit(id: string, patch: Partial<CustomHabit>) {
    update((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
  }
  function deleteHabit(id: string) {
    update((d) => ({
      ...d,
      habits: d.habits.filter((h) => h.id !== id),
      habitLogs: d.habitLogs.filter((l) => l.habitId !== id),
    }));
  }

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">03 // Habits</span>
        <div className="flex items-center gap-3">
          <span className="tile-sub">{totalDone}/{totalGoal} · {pct}%</span>
          <button onClick={() => setManaging((m) => !m)} className="icon-btn">
            <Settings size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {data.habits.map((h) => {
          const done = isDone(h.id, today);
          const count = weeklyCount(h.id);
          return (
            <div key={h.id} className="habit-chip">
              <div className="flex items-center justify-between">
                <span className="text-sm">{h.icon}</span>
                <button
                  onClick={() => toggle(h.id, today)}
                  className={`os-checkbox ${done ? "os-checkbox-done" : ""}`}
                >
                  {done && "✓"}
                </button>
              </div>
              <div className="text-xs mt-2">{h.label}</div>
              <div className="tag mt-1">{count}/{h.goal}</div>
            </div>
          );
        })}
      </div>

      {managing && (
        <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          {data.habits.map((h) => (
            <div key={h.id} className="flex items-center gap-2">
              <input
                value={h.icon}
                onChange={(e) => updateHabit(h.id, { icon: e.target.value })}
                className="os-input w-10 text-center"
              />
              <input
                value={h.label}
                onChange={(e) => updateHabit(h.id, { label: e.target.value })}
                className="os-input flex-1"
              />
              <input
                type="number"
                min={1}
                max={7}
                value={h.goal}
                onChange={(e) => updateHabit(h.id, { goal: Number(e.target.value) })}
                className="os-input w-14"
              />
              <button onClick={() => deleteHabit(h.id)} className="icon-btn">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={addHabit} className="icon-btn mono text-xs flex items-center gap-1">
            <Plus size={12} /> ADD HABIT
          </button>
        </div>
      )}
    </div>
  );
}
