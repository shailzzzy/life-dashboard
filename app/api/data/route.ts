import { NextResponse } from "next/server";
import { loadData, saveData } from "@/lib/db";

export async function GET() {
  const data = await loadData();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  await saveData(body);
  return NextResponse.json({ ok: true });
}
