import { startOfWeek, addDays, addWeeks, format, getISOWeek, getYear } from "date-fns";

export function weekKeyFor(date: Date): string {
  return `${getYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export function weekDaysFor(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function shiftWeek(date: Date, delta: number): Date {
  return addWeeks(date, delta);
}

export function fmt(date: Date, pattern = "EEE MMM d"): string {
  return format(date, pattern);
}

export function quarterKeyFor(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${getYear(date)}-Q${q}`;
}

export function yearKeyFor(date: Date): string {
  return `${getYear(date)}`;
}
