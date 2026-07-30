import { NextRequest, NextResponse } from "next/server";

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

interface GoogleEventsResponse {
  items?: GoogleEvent[];
}

interface EventInput {
  id?: string;
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

const TIME_ZONE = process.env.GOOGLE_CALENDAR_TIME_ZONE || "Europe/London";

function configured() {
  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  );
}

async function accessToken() {
  if (!configured()) throw new Error("Google Calendar is not configured");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const token = await response.json() as GoogleTokenResponse;
  if (!response.ok || !token.access_token) throw new Error("Google token refresh failed");
  return token.access_token;
}

function calendarUrl(path = "") {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${path}`;
}

function localDateTime(value?: string) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

function mapEvent(event: GoogleEvent) {
  const start = event.start?.dateTime
    ? localDateTime(event.start.dateTime)
    : { date: event.start?.date ?? "", time: "" };
  const end = event.end?.dateTime ? localDateTime(event.end.dateTime) : { date: "", time: "" };

  return {
    id: event.id,
    title: event.summary || "Untitled event",
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    source: "google" as const,
  };
}

function googleEventBody(input: EventInput) {
  if (!input.title?.trim() || !input.date || !input.startTime) {
    throw new Error("Title, date and start time are required");
  }

  const endTime = input.endTime || (() => {
    const [hour, minute] = input.startTime!.split(":").map(Number);
    const total = hour * 60 + minute + 60;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  })();
  const crossesMidnight = endTime <= input.startTime;
  const endDate = crossesMidnight
    ? (() => {
        const date = new Date(`${input.date}T12:00:00`);
        date.setDate(date.getDate() + 1);
        return date.toISOString().slice(0, 10);
      })()
    : input.date;

  return {
    summary: input.title.trim(),
    start: { dateTime: `${input.date}T${input.startTime}:00`, timeZone: TIME_ZONE },
    end: { dateTime: `${endDate}T${endTime}:00`, timeZone: TIME_ZONE },
  };
}

export async function GET(request: NextRequest) {
  if (!configured()) return NextResponse.json({ connected: false, events: [] });

  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "A start and end date are required." }, { status: 400 });
  }

  try {
    const token = await accessToken();
    const params = new URLSearchParams({
      timeMin: new Date(`${start}T00:00:00`).toISOString(),
      timeMax: new Date(`${end}T00:00:00`).toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      timeZone: TIME_ZONE,
    });
    const response = await fetch(`${calendarUrl()}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await response.json() as GoogleEventsResponse;
    if (!response.ok) throw new Error("Google Calendar request failed");
    return NextResponse.json({ connected: true, events: (payload.items ?? []).map(mapEvent) });
  } catch {
    return NextResponse.json(
      { connected: false, events: [], error: "Google Calendar sync failed." },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as EventInput;
    const token = await accessToken();
    const response = await fetch(calendarUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEventBody(input)),
      cache: "no-store",
    });
    const event = await response.json() as GoogleEvent;
    if (!response.ok) throw new Error("Google event creation failed");
    return NextResponse.json({ event: mapEvent(event) });
  } catch {
    return NextResponse.json({ error: "Could not create the Google Calendar event." }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const input = await request.json() as EventInput;
    if (!input.id) return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
    const token = await accessToken();
    const response = await fetch(calendarUrl(`/${encodeURIComponent(input.id)}`), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEventBody(input)),
      cache: "no-store",
    });
    const event = await response.json() as GoogleEvent;
    if (!response.ok) throw new Error("Google event update failed");
    return NextResponse.json({ event: mapEvent(event) });
  } catch {
    return NextResponse.json({ error: "Could not update the Google Calendar event." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Event ID is required." }, { status: 400 });

  try {
    const token = await accessToken();
    const response = await fetch(calendarUrl(`/${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok && response.status !== 410) throw new Error("Google event deletion failed");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the Google Calendar event." }, { status: 502 });
  }
}
