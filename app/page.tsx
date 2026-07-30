"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardData, emptyDashboardData } from "@/lib/types";
import TopNav, { Tab } from "@/components/TopNav";
import OperatorCard from "@/components/OperatorCard";
import SessionCard from "@/components/SessionCard";
import FinancePulse from "@/components/FinancePulse";
import TodayTasks from "@/components/TodayTasks";
import HabitsGrid from "@/components/HabitsGrid";
import CalendarStrip from "@/components/CalendarStrip";
import GoalsPanel from "@/components/GoalsPanel";
import NutritionLog from "@/components/NutritionLog";

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <div className="tile-label mono">{label}</div>
      <div className="text-lg mt-2" style={{ color: "var(--ink-faint)" }}>
        Coming soon.
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(emptyDashboardData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("MASTER");
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
    return (
      <div className="os-shell min-h-screen flex items-center justify-center mono text-sm" style={{ color: "var(--ink-faint)" }}>
        LOADING…
      </div>
    );
  }

  const initials = data.operator.name.slice(0, 2).toUpperCase();

  return (
    <div className="os-shell">
      <TopNav tab={tab} setTab={setTab} saving={saving} initials={initials} />

      {tab === "MASTER" && (
        <div className="os-grid">
          <div className="os-col">
            <OperatorCard data={data} update={update} />
            <FinancePulse data={data} update={update} />
            <TodayTasks data={data} update={update} />
          </div>
          <div className="os-col">
            <SessionCard data={data} update={update} />
            <HabitsGrid data={data} update={update} />
            <CalendarStrip data={data} update={update} />
          </div>
          <div className="os-col">
            <GoalsPanel data={data} update={update} />
            <NutritionLog data={data} update={update} />
          </div>
        </div>
      )}

      {tab === "FITNESS" && <ComingSoon label="FITNESS OS" />}
      {tab === "FINANCE" && <ComingSoon label="FINANCE OS" />}
    </div>
  );
}
