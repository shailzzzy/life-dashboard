"use client";

import { useState } from "react";
import { Plus, Trash2, Settings } from "lucide-react";
import { DashboardData, CustomHabit } from "@/lib/types";
import { weekDaysFor, fmt } from "@/lib/dateUtils";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

const DAY_FMT = "EEE";

export default function HabitTracker({ data, update }: Props) {
  const [managing, setManaging] = useState(false);
  const days = weekDaysFor(new Date());
  const dailyHabits = data.habits.filter((h) => h.section === "daily");
  const devotionalHabits = data.habits.filter((h) => h.section === "devotional");

  function isChecked(habitId: string, dateStr: string) {
    return data.habitLogs.some((l) => l.habitId === habitId && l.date === dateStr);
  }

  function toggle(habitId: string, dateStr: string) {
    update((d) => {
      const exists = d.habitLogs.some((l) => l.habitId === habitId && l.date === dateStr);
      return {
        ...d,
        habitLogs: exists
          ? d.habitLogs.filter((l) => !(l.habitId === habitId && l.date === dateStr))
          : [...d.habitLogs, { habitId, date: dateStr }],
      };
    });
  }

  function weeklyCountFor(habitId: string) {
    return days.filter((day) => isChecked(habitId, day.toISOString().slice(0, 10))).length;
  }

  const totalGoal = data.habits.reduce((s, h) => s + h.goal, 0);
  const totalHit = data.habits.reduce((s, h) => s + Math.min(weeklyCountFor(h.id), h.goal), 0);
  const overallPct = totalGoal ? Math.round((totalHit / totalGoal) * 100) : 0;

  function addHabit() {
    const habit: CustomHabit = {
      id: crypto.randomUUID(),
      label: "New Habit",
      icon: "⭐",
      color: "#785b4e",
      bg: "#f6efdf",
      border: "#cfbb9f",
      goal: 5,
      section: "daily",
    };
    update((d) => ({ ...d, habits: [...d.habits, habit] }));
  }

  function updateHabit(id: string, patch: Partial<CustomHabit>) {
    update((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }

  function deleteHabit(id: string) {
    update((d) => ({
      ...d,
      habits: d.habits.filter((h) => h.id !== id),
      habitLogs: d.habitLogs.filter((l) => l.habitId !== id),
    }));
  }

  function renderGrid(habits: CustomHabit[], title: string) {
    if (habits.length === 0) return null;
    return (
      <div className="card">
        <div className="card-header">
          <h3>{title}</h3>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left pb-2 pr-2">Habit</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="pb-2 px-1 text-center opacity-60 font-normal">
                    {fmt(d, DAY_FMT)}
                  </th>
                ))}
                <th className="pb-2 pl-2 text-center opacity-60 font-normal">Goal</th>
              </tr>
            </thead>
            <tbody>
              {habits.map((h) => {
                const count = weeklyCountFor(h.id);
                const hit = count >= h.goal;
                return (
                  <tr key={h.id}>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      <span className="mr-1">{h.icon}</span>
                      {h.label}
                    </td>
                    {days.map((d) => {
                      const dateStr = d.toISOString().slice(0, 10);
                      const checked = isChecked(h.id, dateStr);
                      return (
                        <td key={dateStr} className="text-center px-1">
                          <button
                            onClick={() => toggle(h.id, dateStr)}
                            className="habit-cell"
                            style={{
                              backgroundColor: checked ? h.color : h.bg,
                              borderColor: h.border,
                            }}
                          >
                            {checked && <span style={{ color: "white" }}>✓</span>}
                          </button>
                        </td>
                      );
                    })}
                    <td
                      className="text-center pl-2 font-medium"
                      style={{ color: hit ? h.color : undefined }}
                    >
                      {count}/{h.goal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[color:var(--ink)]">Habit Tracker</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-70">{overallPct}% this week</span>
          <button onClick={() => setManaging((m) => !m)} className="card-btn">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {renderGrid(dailyHabits, "Daily")}
      {renderGrid(devotionalHabits, "Devotional")}

      {managing && (
        <div className="card">
          <div className="card-header">
            <h3>Manage Habits</h3>
            <button onClick={addHabit} className="card-btn">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3 mt-3">
            {data.habits.map((h) => (
              <div key={h.id} className="flex items-center gap-2 flex-wrap">
                <input
                  value={h.icon}
                  onChange={(e) => updateHabit(h.id, { icon: e.target.value })}
                  className="input w-12 text-center"
                />
                <input
                  value={h.label}
                  onChange={(e) => updateHabit(h.id, { label: e.target.value })}
                  className="input flex-1 min-w-[120px]"
                />
                <select
                  value={h.section}
                  onChange={(e) => updateHabit(h.id, { section: e.target.value as "daily" | "devotional" })}
                  className="input"
                >
                  <option value="daily">Daily</option>
                  <option value="devotional">Devotional</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={h.goal}
                  onChange={(e) => updateHabit(h.id, { goal: Number(e.target.value) })}
                  className="input w-16"
                />
                <input
                  type="color"
                  value={h.color}
                  onChange={(e) => updateHabit(h.id, { color: e.target.value })}
                  className="w-8 h-8"
                />
                <button onClick={() => deleteHabit(h.id)} className="card-btn">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
