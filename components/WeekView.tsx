"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { DashboardData, Task } from "@/lib/types";
import { weekKeyFor, shiftWeek, fmt } from "@/lib/dateUtils";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

export default function WeekView({ data, update }: Props) {
  const [cursor, setCursor] = useState(new Date());
  const [newTask, setNewTask] = useState("");
  const weekKey = weekKeyFor(cursor);
  const tasks = data.tasks.filter((t) => t.weekKey === weekKey);
  const focus = data.weeklyFocus[weekKey] ?? "";
  const reflection = data.reflections[weekKey] ?? "";

  function addTask() {
    if (!newTask.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      completed: false,
      weekKey,
      createdAt: new Date().toISOString(),
    };
    update((d) => ({ ...d, tasks: [...d.tasks, task] }));
    setNewTask("");
  }

  function toggleTask(id: string) {
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  }

  function removeTask(id: string) {
    update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }

  function setFocus(v: string) {
    update((d) => ({ ...d, weeklyFocus: { ...d.weeklyFocus, [weekKey]: v } }));
  }

  function setReflection(v: string) {
    update((d) => ({ ...d, reflections: { ...d.reflections, [weekKey]: v } }));
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setCursor(shiftWeek(cursor, -1))} className="card-btn">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-semibold text-[color:var(--ink)]">
          Week of {fmt(cursor)}
        </h2>
        <button onClick={() => setCursor(shiftWeek(cursor, 1))} className="card-btn">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Checklist */}
        <div className="card">
          <div className="card-header">
            <h3>This Week&apos;s Tasks</h3>
            <span className="text-sm opacity-70">{completedCount}/{tasks.length}</span>
          </div>
          <div className="space-y-2 mt-3">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleTask(t.id)}
                  className={`checkbox ${t.completed ? "checkbox-done" : ""}`}
                >
                  {t.completed && "✓"}
                </button>
                <span className={`flex-1 ${t.completed ? "line-through opacity-50" : ""}`}>
                  {t.text}
                </span>
                <button
                  onClick={() => removeTask(t.id)}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task..."
              className="input flex-1"
            />
            <button onClick={addTask} className="card-btn">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Weekly Focus */}
        <div className="card">
          <div className="card-header">
            <h3>Weekly Focus</h3>
          </div>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="What's the one thing that matters most this week?"
            className="textarea mt-3"
            rows={4}
          />
        </div>

        {/* Reflections */}
        <div className="card md:col-span-2">
          <div className="card-header">
            <h3>Reflections</h3>
          </div>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="How did this week go?"
            className="textarea mt-3"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
