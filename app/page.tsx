"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardData, emptyDashboardData } from "@/lib/types";
import WeekView from "@/components/WeekView";
import HabitTracker from "@/components/HabitTracker";
import GoalsView from "@/components/GoalsView";

type Tab = "week" | "habits" | "goals";

export default function Home() {
  const [data, setData] = useState<DashboardData>(emptyDashboardData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("week");
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoaded(true);
      });
  }, []);

  function update(updater: (d: DashboardData) => DashboardData) {
    setData((prev) => {
      const next = updater(prev);
      // throttle auto-save so we're not hitting the DB on every keystroke
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        setSaving(true);
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        setSaving(false);
      }, 800);
      return next;
    });
  }

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-4xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[color:var(--ink)]">✦ Shailen&apos;s Dashboard</h1>
        <span className="text-xs opacity-50">{saving ? "Saving…" : "Saved"}</span>
      </header>

      <nav className="max-w-4xl mx-auto px-6 flex gap-2 mb-8">
        {(["week", "habits", "goals"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? "tab-btn-active" : ""}`}
          >
            {t === "week" ? "Week" : t === "habits" ? "Habits" : "Goals"}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto px-6 pb-16">
        {tab === "week" && <WeekView data={data} update={update} />}
        {tab === "habits" && <HabitTracker data={data} update={update} />}
        {tab === "goals" && <GoalsView data={data} update={update} />}
      </main>
    </div>
  );
}
