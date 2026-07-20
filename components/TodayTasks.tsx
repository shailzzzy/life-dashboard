"use client";

import { X } from "lucide-react";
import { DashboardData } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

export default function TodayTasks({ data, update }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = data.tasksToday.filter((t) => t.date === today);

  function toggle(id: string) {
    update((d) => ({
      ...d,
      tasksToday: d.tasksToday.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  }

  function remove(id: string) {
    update((d) => ({ ...d, tasksToday: d.tasksToday.filter((t) => t.id !== id) }));
  }

  const open = tasks.filter((t) => !t.completed).length;

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">06 // Today · Key</span>
        <span className="tile-sub">{open}</span>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 && <div className="tile-sub">No tasks yet — capture one above.</div>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(t.id)}
              className={`os-checkbox ${t.completed ? "os-checkbox-done" : ""}`}
            >
              {t.completed && "✓"}
            </button>
            <div className="flex-1">
              <div className={`text-sm ${t.completed ? "line-through opacity-40" : ""}`}>{t.text}</div>
              <div className="tag">{t.tag}</div>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="icon-btn opacity-0 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
