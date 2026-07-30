import { NextRequest, NextResponse } from "next/server";

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
}

interface GoogleEventsResponse {
  items?: GoogleEvent[];
}

function configured() {
  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  );
}

export async function GET(request: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ connected: false, events: [] });
  }

  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "A start and end date are required." }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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

    const token = await tokenResponse.json() as GoogleTokenResponse;
    if (!tokenResponse.ok || !token.access_token) throw new Error("Google token refresh failed");

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const params = new URLSearchParams({
      timeMin: new Date(`${start}T00:00:00`).toISOString(),
      timeMax: new Date(`${end}T00:00:00`).toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      },
    );

    const payload = await eventsResponse.json() as GoogleEventsResponse;
    if (!eventsResponse.ok) throw new Error("Google Calendar request failed");

    const events = (payload.items ?? []).map((event) => {
      const startValue = event.start?.dateTime ?? event.start?.date ?? start;
      const dateTime = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      return {
        id: event.id,
        title: event.summary || "Untitled event",
        date: startValue.slice(0, 10),
        startTime: dateTime
          ? dateTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          : "",
        source: "google" as const,
      };
    });

    return NextResponse.json({ connected: true, events });
  } catch {
    return NextResponse.json(
      { connected: false, events: [], error: "Google Calendar sync failed." },
      { status: 502 },
    );
  }
}
