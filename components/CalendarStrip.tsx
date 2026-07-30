"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { DashboardData, CalEvent } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

interface GoogleCalendarEvent extends CalEvent {
  source: "google";
}

interface EditingEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthGrid(anchor: Date) {
  const mondayOffset = (anchor.getDay() + 6) % 7;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - mondayOffset);

  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export default function CalendarStrip({ data, update }: Props) {
  const now = new Date();
  const today = dateKey(now);
  const [month, setMonth] = useState(() => now);
  const [selected, setSelected] = useState(today);
  const [newEvent, setNewEvent] = useState({ startTime: "", endTime: "", title: "" });
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [editing, setEditing] = useState<EditingEvent | null>(null);
  const [calendarError, setCalendarError] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

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
      setCalendarError(result.error ?? "");
    } catch {
      setConnected(false);
      setGoogleEvents([]);
      setCalendarError("Calendar sync is unavailable.");
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
    setMonth((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + offset * 28);
      return next;
    });
  }

  async function addEvent() {
    if (!newEvent.title.trim() || !newEvent.startTime.trim()) return;
    setSavingEvent(true);
    setCalendarError("");

    if (connected) {
      try {
        const response = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newEvent.title.trim(),
            date: selected,
            startTime: newEvent.startTime,
            endTime: newEvent.endTime,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.event) throw new Error();
        setGoogleEvents((current) => [...current, result.event]);
        setNewEvent({ startTime: "", endTime: "", title: "" });
      } catch {
        setCalendarError("The event could not be added to Google Calendar.");
      } finally {
        setSavingEvent(false);
      }
      return;
    }

    const event: CalEvent = {
      id: crypto.randomUUID(),
      date: selected,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      title: newEvent.title.trim(),
    };
    update((current) => ({ ...current, calendarEvents: [...current.calendarEvents, event] }));
    setNewEvent({ startTime: "", endTime: "", title: "" });
    setSavingEvent(false);
  }

  function removeEvent(id: string) {
    update((current) => ({
      ...current,
      calendarEvents: current.calendarEvents.filter((event) => event.id !== id),
    }));
  }

  function beginEditing(event: GoogleCalendarEvent) {
    setEditing({
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime ?? "",
    });
    setCalendarError("");
  }

  async function saveGoogleEvent() {
    if (!editing?.title.trim() || !editing.date || !editing.startTime) return;
    setSavingEvent(true);
    setCalendarError("");
    try {
      const response = await fetch("/api/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const result = await response.json();
      if (!response.ok || !result.event) throw new Error();
      setGoogleEvents((current) =>
        current.map((event) => event.id === editing.id ? result.event : event),
      );
      setEditing(null);
    } catch {
      setCalendarError("The Google Calendar event could not be updated.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function removeGoogleEvent(event: GoogleCalendarEvent) {
    if (!window.confirm(`Delete “${event.title}” from Google Calendar?`)) return;
    setSavingEvent(true);
    setCalendarError("");
    try {
      const response = await fetch(`/api/calendar?id=${encodeURIComponent(event.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setGoogleEvents((current) => current.filter((item) => item.id !== event.id));
      if (editing?.id === event.id) setEditing(null);
    } catch {
      setCalendarError("The Google Calendar event could not be deleted.");
    } finally {
      setSavingEvent(false);
    }
  }

  return (
    <div className="tile month-calendar">
      <div className="month-calendar-header">
        <div>
          <span className="tile-label">Calendar</span>
          <h2 className="month-calendar-title">
            {days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            {" — "}
            {days[days.length - 1].toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </h2>
        </div>

        <div className="month-calendar-actions">
          <span className={`calendar-connection ${connected ? "is-connected" : ""}`}>
            <span className="calendar-connection-dot" />
            {connected ? "Two-way sync live" : "Local calendar"}
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
          const isSelected = key === selected;
          const isToday = key === today;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={[
                "month-calendar-day",
                isSelected ? "is-selected" : "",
                isToday ? "is-today" : "",
              ].join(" ")}
              aria-label={`${date.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}, ${events.length} events`}
            >
              <span className="month-calendar-number">{date.getDate()}</span>
              <span className="month-calendar-events">
                {events.slice(0, 2).map((event) => (
                  <span
                    key={`${"source" in event ? event.source : "local"}-${event.id}`}
                    className={`month-calendar-event ${"source" in event ? "is-google" : ""}`}
                  >
                    {event.startTime && <span>{event.startTime}</span>} {event.title}
                  </span>
                ))}
                {events.length > 2 && <span className="month-calendar-more">+{events.length - 2} more</span>}
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

            if (isGoogle && editing?.id === event.id) {
              return (
                <div key={`google-${event.id}`} className="calendar-edit-event">
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(item) => setEditing((current) => current && ({ ...current, date: item.target.value }))}
                    className="os-input calendar-date-input"
                    aria-label="Event date"
                  />
                  <input
                    type="time"
                    value={editing.startTime}
                    onChange={(item) => setEditing((current) => current && ({ ...current, startTime: item.target.value }))}
                    className="os-input calendar-time-input"
                    aria-label="Event start time"
                  />
                  <input
                    type="time"
                    value={editing.endTime}
                    onChange={(item) => setEditing((current) => current && ({ ...current, endTime: item.target.value }))}
                    className="os-input calendar-time-input"
                    aria-label="Event end time"
                  />
                  <input
                    value={editing.title}
                    onChange={(item) => setEditing((current) => current && ({ ...current, title: item.target.value }))}
                    className="os-input flex-1"
                    aria-label="Event title"
                  />
                  <button type="button" onClick={saveGoogleEvent} className="icon-btn" aria-label="Save event">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="icon-btn" aria-label="Cancel editing">
                    <X size={14} />
                  </button>
                </div>
              );
            }

            return (
              <div key={`${isGoogle ? "google" : "local"}-${event.id}`} className="calendar-day-event">
                <span className="mono tag">
                  {event.startTime || "ALL DAY"}
                  {event.endTime ? `–${event.endTime}` : ""}
                </span>
                <span className="text-sm flex-1">{event.title}</span>
                {isGoogle ? (
                  <>
                    <span className="calendar-source">Google</span>
                    <button
                      type="button"
                      onClick={() => beginEditing(event as GoogleCalendarEvent)}
                      className="icon-btn"
                      aria-label={`Edit ${event.title}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGoogleEvent(event as GoogleCalendarEvent)}
                      className="icon-btn"
                      aria-label={`Delete ${event.title}`}
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => removeEvent(event.id)} className="icon-btn" aria-label={`Remove ${event.title}`}>
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {calendarError && <div className="calendar-error">{calendarError}</div>}

        <div className="calendar-add-event">
          <input
            type="time"
            value={newEvent.startTime}
            onChange={(event) => setNewEvent((current) => ({ ...current, startTime: event.target.value }))}
            className="os-input calendar-time-input"
            aria-label="Event start time"
          />
          <input
            type="time"
            value={newEvent.endTime}
            onChange={(event) => setNewEvent((current) => ({ ...current, endTime: event.target.value }))}
            className="os-input calendar-time-input"
            aria-label="Event end time"
          />
          <input
            value={newEvent.title}
            onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))}
            onKeyDown={(event) => event.key === "Enter" && addEvent()}
            placeholder={connected ? "Add to Google Calendar..." : "Add a local event..."}
            className="os-input flex-1"
          />
          <button type="button" onClick={addEvent} className="calendar-add-button" disabled={savingEvent}>
            <Plus size={14} /> {savingEvent ? "Saving…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
