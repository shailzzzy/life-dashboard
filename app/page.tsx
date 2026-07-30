"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardData, emptyDashboardData } from "@/lib/types";
import TopNav, { Tab } from "@/components/TopNav";
import SessionCard from "@/components/SessionCard";
import TodayTasks from "@/components/TodayTasks";
import CalendarStrip from "@/components/CalendarStrip";

const OS_TILES: { id: Tab; title: string; summary: string }[] = [
  {
    id: "MASTER",
    title: "Master OS",
    summary: "Your command centre for today, goals, habits and the bigger picture.",
  },
  {
    id: "FITNESS",
    title: "Fitness OS",
    summary: "Track training, nutrition, recovery and the routines that keep you moving.",
  },
  {
    id: "FINANCE",
    title: "Finance OS",
    summary: "Monitor net worth, cash flow and the financial decisions ahead.",
  },
];

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
        <>
          <div className="os-switcher" aria-label="Operating systems">
            {OS_TILES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`os-switcher-tile ${item.id === "MASTER" ? "os-switcher-tile-active" : ""}`}
                aria-label={`Open ${item.title}`}
              >
                <div className="os-switcher-topline">
                  <span className="os-switcher-title">{item.title}</span>
                  <span className="os-live">
                    <span className="os-live-dot" />
                    Live
                  </span>
                </div>
                <p className="os-switcher-summary">{item.summary}</p>
                <span className="os-switcher-link">
                  {item.id === "MASTER" ? "Current system" : "Open system"} <span aria-hidden="true">↗</span>
                </span>
              </button>
            ))}
          </div>

          <div className="os-grid os-grid-two">
            <div className="os-span-full">
              <SessionCard data={data} update={update} />
            </div>
            <div className="os-col">
              <TodayTasks data={data} update={update} />
            </div>
            <div className="os-span-full">
              <CalendarStrip data={data} update={update} />
            </div>
          </div>
        </>
      )}

      {tab === "FITNESS" && <ComingSoon label="FITNESS OS" />}
      {tab === "FINANCE" && <ComingSoon label="FINANCE OS" />}
    </div>
  );
}
