// Single flexible data blob for the whole dashboard.
// New features = new keys here. No DB migrations required.

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  weekKey: string; // e.g. "2026-W28"
  createdAt: string;
}

export interface CustomHabit {
  id: string;
  label: string;
  sublabel?: string;
  icon: string; // emoji
  color: string;
  bg: string;
  border: string;
  goal: number; // e.g. 5 out of 7 days
  section: "daily" | "devotional";
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
}

export interface Goal {
  id: string;
  periodKey: string; // "2026-Q3" or "2026"
  category: "Finance" | "Health" | "Career" | "Personal";
  text: string;
  completed: boolean;
}

export interface YearlyReflection {
  vision: string;
  nonNegotiables: string;
  focus: string;
  change: string;
}

export interface DashboardData {
  tasks: Task[];
  weeklyFocus: Record<string, string>; // weekKey -> focus text
  reflections: Record<string, string>; // weekKey -> reflection text
  habits: CustomHabit[];
  habitLogs: HabitLog[];
  goals: Goal[];
  yearlyReflections: Record<string, YearlyReflection>; // year -> reflection
}

export const emptyDashboardData: DashboardData = {
  tasks: [],
  weeklyFocus: {},
  reflections: {},
  habits: [
    { id: "h1", label: "Applied to jobs", icon: "💼", color: "#785b4e", bg: "#f6efdf", border: "#cfbb9f", goal: 5, section: "daily" },
    { id: "h2", label: "Exercise", icon: "🏃", color: "#7a816c", bg: "#eef1e8", border: "#8e967d", goal: 4, section: "daily" },
    { id: "h3", label: "Gratitude", icon: "🙏", color: "#d68d84", bg: "#fbeceb", border: "#d68d84", goal: 7, section: "devotional" },
  ],
  habitLogs: [],
  goals: [],
  yearlyReflections: {},
};
