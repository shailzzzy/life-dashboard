"use client";

import { useEffect, useState } from "react";
import { DashboardData, TodayTask } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function SessionCard({ data, update }: Props) {
  const [now, setNow] = useState<Date | null>(() => new Date());
  const [capture, setCapture] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  function submitCapture() {
    if (!capture.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const task: TodayTask = {
      id: crypto.randomUUID(),
      text: capture.trim(),
      tag: "CAPTURE",
      completed: false,
      date: today,
    };
    update((d) => ({ ...d, tasksToday: [...d.tasksToday, task] }));
    setCapture("");
  }

  const timeStr = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";
  const dayStr = now ? now.toLocaleDateString("en-US", { weekday: "long" }) : "";

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">02 // Session</span>
        <span className="tile-sub">LOCAL TIME</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-semibold">
            {greeting(now?.getHours() ?? 12)}, {data.operator.name}.
          </div>
          <div className="tag mt-1">{dayStr}</div>
        </div>
        <div className="mono text-2xl">{timeStr}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCapture()}
          placeholder="Capture a thought or task..."
          className="os-input flex-1"
        />
        <button onClick={submitCapture} className="icon-btn os-input mono" style={{ width: "auto" }}>
          CAPTURE
        </button>
      </div>
    </div>
  );
}
