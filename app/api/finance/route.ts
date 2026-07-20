import { NextResponse } from "next/server";

interface Row {
  date: string;
  value: number;
}

function parseCsv(csv: string): Row[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  let dateIdx = header.findIndex((h) => h.includes("date"));
  let valueIdx = header.findIndex(
    (h) => h.includes("net worth") || h.includes("networth") || h.includes("balance") || h.includes("value")
  );
  if (dateIdx === -1) dateIdx = 0;
  if (valueIdx === -1) valueIdx = 1;

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
    if (cols.length <= Math.max(dateIdx, valueIdx)) continue;
    const date = cols[dateIdx];
    const value = Number(cols[valueIdx].replace(/[^0-9.-]/g, ""));
    if (!date || Number.isNaN(value)) continue;
    rows.push({ date, value });
  }
  return rows;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "No sheet URL configured" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Sheet fetch failed (${res.status})` }, { status: 502 });
    }
    const csv = await res.text();
    const rows = parseCsv(csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Could not parse any rows from sheet" }, { status: 422 });
    }

    const latest = rows[rows.length - 1];
    const prevDay = rows.length >= 2 ? rows[rows.length - 2] : latest;

    const now = new Date(latest.date);
    const monthAgoTarget = new Date(now);
    monthAgoTarget.setDate(monthAgoTarget.getDate() - 30);
    let monthAgoRow = rows[0];
    for (const r of rows) {
      if (new Date(r.date) <= monthAgoTarget) monthAgoRow = r;
    }

    const dailyChange = latest.value - prevDay.value;
    const monthlyChange = latest.value - monthAgoRow.value;

    return NextResponse.json({
      netWorth: latest.value,
      dailyChange,
      dailyChangePct: prevDay.value ? (dailyChange / prevDay.value) * 100 : 0,
      monthlyChange,
      monthlyChangePct: monthAgoRow.value ? (monthlyChange / monthAgoRow.value) * 100 : 0,
      series: rows.slice(-30).map((r) => r.value),
      updatedAt: latest.date,
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch sheet" }, { status: 502 });
  }
}
