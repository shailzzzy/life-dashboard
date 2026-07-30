"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, X } from "lucide-react";
import { DashboardData, CalEvent } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

interface GoogleCalendarEvent extends CalEvent {
  source: "google";
}

const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export default function CalendarStrip({ data, update }: Props) {
  const now = new Date();
  const today = dateKey(now);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [newEvent, setNewEvent] = useState({ time: "", title: "" });
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);

  const days = useMemo(() => monthGrid(month), [month]);
  const visibleStart = dateKey(days[0]);
  const visibleEnd = dateKey(new Date(days[days.length - 1].getTime() + 86400000));

  const syncGoogle = useCallback(async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/calendar?start=${visibleStart}&end=${visibleEnd}`);
      const result = await response.json();
      setConnected(Boolean(result.connected));
      setGoogleEvents(result.events ?? []);
    } catch {
      setConnected(false);
      setGoogleEvents([]);
    } finally {
      setSyncing(false);
    }
  }, [visibleEnd, visibleStart]);

  useEffect(() => {
    syncGoogle();
  }, [syncGoogle]);

  const allEvents = useMemo(
    () => [...data.calendarEvents, ...googleEvents],
    [data.calendarEvents, googleEvents],
  );

  const selectedEvents = allEvents
    .filter((event) => event.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  function eventsFor(date: Date) {
    return allEvents
      .filter((event) => event.date === dateKey(date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function addEvent() {
    if (!newEvent.title.trim() || !newEvent.time.trim()) return;
    const event: CalEvent = {
      id: crypto.randomUUID(),
      date: selected,
      startTime: newEvent.time,
      title: newEvent.title.trim(),
    };
    update((current) => ({ ...current, calendarEvents: [...current.calendarEvents, event] }));
    setNewEvent({ time: "", title: "" });
  }

  function removeEvent(id: string) {
    update((current) => ({
      ...current,
      calendarEvents: current.calendarEvents.filter((event) => event.id !== id),
    }));
  }

  return (
    <div className="tile month-calendar">
      <div className="month-calendar-header">
        <div>
          <span className="tile-label">Calendar</span>
          <h2 className="month-calendar-title">
            {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </h2>
        </div>

        <div className="month-calendar-actions">
          <span className={`calendar-connection ${connected ? "is-connected" : ""}`}>
            <span className="calendar-connection-dot" />
            {connected ? "Google Calendar live" : "Local calendar"}
          </span>
          <button
            type="button"
            onClick={syncGoogle}
            className="icon-btn"
            aria-label="Refresh Google Calendar"
          >
            <RefreshCw size={14} className={syncing ? "calendar-spin" : ""} />
          </button>
          <button type="button" onClick={() => changeMonth(-1)} className="icon-btn" aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => changeMonth(1)} className="icon-btn" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="month-calendar-grid">
        {DOW.map((day) => (
          <div key={day} className="month-calendar-dow">{day}</div>
        ))}

        {days.map((date) => {
          const key = dateKey(date);
          const events = eventsFor(date);
          const outsideMonth = date.getMonth() !== month.getMonth();
          const isSelected = key === selected;
          const isToday = key === today;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={[
                "month-calendar-day",
                outsideMonth ? "is-outside" : "",
                isSelected ? "is-selected" : "",
                isToday ? "is-today" : "",
              ].join(" ")}
              aria-label={`${date.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}, ${events.length} events`}
            >
              <span className="month-calendar-number">{date.getDate()}</span>
              <span className="month-calendar-events">
                {events.slice(0, 3).map((event) => (
                  <span
                    key={`${"source" in event ? event.source : "local"}-${event.id}`}
                    className={`month-calendar-event ${"source" in event ? "is-google" : ""}`}
                  >
                    {event.startTime && <span>{event.startTime}</span>} {event.title}
                  </span>
                ))}
                {events.length > 3 && <span className="month-calendar-more">+{events.length - 3} more</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="calendar-day-detail">
        <div className="calendar-day-detail-header">
          <div>
            <span className="tile-label">Selected day</span>
            <div className="calendar-selected-date">
              {new Date(`${selected}T12:00:00`).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          </div>
          <span className="tile-sub">{selectedEvents.length} EVENTS</span>
        </div>

        <div className="calendar-day-events">
          {selectedEvents.length === 0 && <div className="tile-sub">No events.</div>}
          {selectedEvents.map((event) => {
            const isGoogle = "source" in event;
            return (
              <div key={`${isGoogle ? "google" : "local"}-${event.id}`} className="calendar-day-event">
                <span className="mono tag">{event.startTime || "ALL DAY"}</span>
                <span className="text-sm flex-1">{event.title}</span>
                {isGoogle ? (
                  <span className="calendar-source">Google</span>
                ) : (
                  <button onClick={() => removeEvent(event.id)} className="icon-btn" aria-label={`Remove ${event.title}`}>
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="calendar-add-event">
          <input
            type="time"
            value={newEvent.time}
            onChange={(event) => setNewEvent((current) => ({ ...current, time: event.target.value }))}
            className="os-input calendar-time-input"
            aria-label="Event time"
          />
          <input
            value={newEvent.title}
            onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))}
            onKeyDown={(event) => event.key === "Enter" && addEvent()}
            placeholder="Add a local event..."
            className="os-input flex-1"
          />
          <button type="button" onClick={addEvent} className="calendar-add-button">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
