"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DashboardData, GoalItem } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

function GoalList({
  title,
  items,
  onAdd,
  onToggle,
  onRemove,
}: {
  title: string;
  items: GoalItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="tag mb-2">{title}</div>
      <div className="space-y-1.5">
        {items.map((g) => (
          <div key={g.id} className="flex items-center gap-2 group">
            <button
              onClick={() => onToggle(g.id)}
              className={`os-checkbox ${g.completed ? "os-checkbox-done" : ""}`}
            >
              {g.completed && "✓"}
            </button>
            <span className={`text-sm flex-1 ${g.completed ? "line-through opacity-40" : ""}`}>
              {g.text}
            </span>
            <button onClick={() => onRemove(g.id)} className="icon-btn opacity-0 group-hover:opacity-100">
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onAdd(text.trim());
              setText("");
            }
          }}
          placeholder={`Add a ${title.toLowerCase()} goal...`}
          className="os-input flex-1 text-xs"
        />
        <button
          onClick={() => {
            if (text.trim()) {
              onAdd(text.trim());
              setText("");
            }
          }}
          className="icon-btn"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

export default function GoalsPanel({ data, update }: Props) {
  function addWeekly(text: string) {
    update((d) => ({
      ...d,
      goalsWeekly: [...d.goalsWeekly, { id: crypto.randomUUID(), text, completed: false }],
    }));
  }
  function addMonthly(text: string) {
    update((d) => ({
      ...d,
      goalsMonthly: [...d.goalsMonthly, { id: crypto.randomUUID(), text, completed: false }],
    }));
  }
  function toggleWeekly(id: string) {
    update((d) => ({
      ...d,
      goalsWeekly: d.goalsWeekly.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
    }));
  }
  function toggleMonthly(id: string) {
    update((d) => ({
      ...d,
      goalsMonthly: d.goalsMonthly.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
    }));
  }
  function removeWeekly(id: string) {
    update((d) => ({ ...d, goalsWeekly: d.goalsWeekly.filter((g) => g.id !== id) }));
  }
  function removeMonthly(id: string) {
    update((d) => ({ ...d, goalsMonthly: d.goalsMonthly.filter((g) => g.id !== id) }));
  }

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">07 // Goals</span>
      </div>
      <div className="space-y-4">
        <GoalList
          title="This week"
          items={data.goalsWeekly}
          onAdd={addWeekly}
          onToggle={toggleWeekly}
          onRemove={removeWeekly}
        />
        <GoalList
          title="This month"
          items={data.goalsMonthly}
          onAdd={addMonthly}
          onToggle={toggleMonthly}
          onRemove={removeMonthly}
        />
      </div>
    </div>
  );
}
