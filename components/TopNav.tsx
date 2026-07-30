"use client";

import { useEffect, useState } from "react";

export type Tab = "MASTER" | "FITNESS" | "FINANCE";

const TABS: { id: Tab; label: string }[] = [
  { id: "MASTER", label: "MASTER OS" },
  { id: "FITNESS", label: "FITNESS OS" },
  { id: "FINANCE", label: "FINANCE OS" },
];

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  saving: boolean;
  initials: string;
}

export default function TopNav({ tab, setTab, saving, initials }: Props) {
  const [now, setNow] = useState<Date | null>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now
    ? now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "";
  const timeStr = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "";

  return (
    <div className="topbar">
      <div className="brand">
        <span className="dot" />
        SHAILEN OS // V0
      </div>

      <div className="nav-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`nav-tab ${tab === item.id ? "nav-tab-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="topbar-right">
        <span>{saving ? "SAVING…" : "SAVED"}</span>
        <span>{dateStr} {timeStr}</span>
        <div
          className="mono"
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
