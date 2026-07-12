"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DashboardData, Goal } from "@/lib/types";
import { quarterKeyFor, yearKeyFor } from "@/lib/dateUtils";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

const CATEGORIES: Goal["category"][] = ["Career", "Finance", "Health", "Personal"];

export default function GoalsView({ data, update }: Props) {
  const now = new Date();
  const quarterKey = quarterKeyFor(now);
  const yearKey = yearKeyFor(now);
  const [newGoalText, setNewGoalText] = useState<Record<string, string>>({});

  const reflection = data.yearlyReflections[yearKey] ?? {
    vision: "",
    nonNegotiables: "",
    focus: "",
    change: "",
  };

  function setReflectionField(field: keyof typeof reflection, value: string) {
    update((d) => ({
      ...d,
      yearlyReflections: {
        ...d.yearlyReflections,
        [yearKey]: { ...reflection, [field]: value },
      },
    }));
  }

  function addGoal(category: Goal["category"]) {
    const text = (newGoalText[category] ?? "").trim();
    if (!text) return;
    const goal: Goal = {
      id: crypto.randomUUID(),
      periodKey: quarterKey,
      category,
      text,
      completed: false,
    };
    update((d) => ({ ...d, goals: [...d.goals, goal] }));
    setNewGoalText((s) => ({ ...s, [category]: "" }));
  }

  function toggleGoal(id: string) {
    update((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
    }));
  }

  function removeGoal(id: string) {
    update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }

  const quarterGoals = data.goals.filter((g) => g.periodKey === quarterKey);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[color:var(--ink)]">
        Goals — {quarterKey}
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const goals = quarterGoals.filter((g) => g.category === cat);
          const done = goals.filter((g) => g.completed).length;
          return (
            <div key={cat} className="card">
              <div className="card-header">
                <h3>{cat}</h3>
                <span className="text-sm opacity-70">{done}/{goals.length}</span>
              </div>
              <div className="space-y-2 mt-3">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleGoal(g.id)}
                      className={`checkbox ${g.completed ? "checkbox-done" : ""}`}
                    >
                      {g.completed && "✓"}
                    </button>
                    <span className={`flex-1 ${g.completed ? "line-through opacity-50" : ""}`}>
                      {g.text}
                    </span>
                    <button
                      onClick={() => removeGoal(g.id)}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <input
                  value={newGoalText[cat] ?? ""}
                  onChange={(e) => setNewGoalText((s) => ({ ...s, [cat]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addGoal(cat)}
                  placeholder={`Add a ${cat.toLowerCase()} goal...`}
                  className="input flex-1"
                />
                <button onClick={() => addGoal(cat)} className="card-btn">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{yearKey} Reflection</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 mt-3">
          <div>
            <label className="label">Vision for this year</label>
            <textarea
              value={reflection.vision}
              onChange={(e) => setReflectionField("vision", e.target.value)}
              className="textarea"
              rows={3}
            />
          </div>
          <div>
            <label className="label">Non-negotiables</label>
            <textarea
              value={reflection.nonNegotiables}
              onChange={(e) => setReflectionField("nonNegotiables", e.target.value)}
              className="textarea"
              rows={3}
            />
          </div>
          <div>
            <label className="label">What I&apos;m focused on</label>
            <textarea
              value={reflection.focus}
              onChange={(e) => setReflectionField("focus", e.target.value)}
              className="textarea"
              rows={3}
            />
          </div>
          <div>
            <label className="label">What I want to change</label>
            <textarea
              value={reflection.change}
              onChange={(e) => setReflectionField("change", e.target.value)}
              className="textarea"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
