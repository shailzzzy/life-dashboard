"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DashboardData, CalEvent } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

function weekDates(): Date[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function CalendarStrip({ data, update }: Props) {
  const week = weekDates();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = useState(todayStr);
  const [newEvent, setNewEvent] = useState({ time: "", title: "" });

  const dayEvents = data.calendarEvents
    .filter((e) => e.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  function addEvent() {
    if (!newEvent.title.trim() || !newEvent.time.trim()) return;
    const ev: CalEvent = {
      id: crypto.randomUUID(),
      date: selected,
      startTime: newEvent.time,
      title: newEvent.title.trim(),
    };
    update((d) => ({ ...d, calendarEvents: [...d.calendarEvents, ev] }));
    setNewEvent({ time: "", title: "" });
  }

  function removeEvent(id: string) {
    update((d) => ({ ...d, calendarEvents: d.calendarEvents.filter((e) => e.id !== id) }));
  }

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">04 // Calendar</span>
        <span className="tile-sub">{dayEvents.length} EVENTS</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {week.map((d, i) => {
          const dateStr = d.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          return (
            <button
              key={dateStr}
              onClick={() => setSelected(dateStr)}
              className={`cal-day mono ${isSelected ? "cal-day-active" : ""}`}
              style={isToday && !isSelected ? { borderColor: "var(--border-strong)" } : undefined}
            >
              <div className="tag">{DOW[i]}</div>
              <div className="text-sm mt-1">{d.getDate()}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {dayEvents.length === 0 && <div className="tile-sub">No events.</div>}
        {dayEvents.map((e) => (
          <div key={e.id} className="flex items-center gap-2 group">
            <span className="mono tag" style={{ minWidth: 40 }}>{e.startTime}</span>
            <span className="text-sm flex-1">{e.title}</span>
            <button onClick={() => removeEvent(e.id)} className="icon-btn opacity-0 group-hover:opacity-100">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          value={newEvent.time}
          onChange={(e) => setNewEvent((s) => ({ ...s, time: e.target.value }))}
          placeholder="10:00"
          className="os-input w-20"
        />
        <input
          value={newEvent.title}
          onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && addEvent()}
          placeholder="Event title..."
          className="os-input flex-1"
        />
        <button onClick={addEvent} className="icon-btn">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
