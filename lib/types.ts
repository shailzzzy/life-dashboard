// Single flexible data blob for the whole dashboard.
// New features = new keys here. No DB migrations required.

export interface Operator {
  name: string;
  title: string;
  focus: string;
  streak: number;
}

export interface TodayTask {
  id: string;
  text: string;
  tag: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

export interface CustomHabit {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  goal: number; // times per week
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
}

export interface CalEvent {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "10:00"
  endTime?: string;
  title: string;
}

export interface GoalItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NutritionEntry {
  id: string;
  date: string;
  text: string;
  kcal: number;
}

export interface DashboardData {
  operator: Operator;
  tasksToday: TodayTask[];
  habits: CustomHabit[];
  habitLogs: HabitLog[];
  calendarEvents: CalEvent[];
  goalsWeekly: GoalItem[];
  goalsMonthly: GoalItem[];
  nutritionLog: NutritionEntry[];
  nutritionGoalKcal: number;
  financeSheetUrl: string; // published-to-web CSV url
}

export const emptyDashboardData: DashboardData = {
  operator: {
    name: "Shailen",
    title: "",
    focus: "Landing the next role.",
    streak: 0,
  },
  tasksToday: [],
  habits: [
    { id: "h1", label: "Job applications", icon: "💼", goal: 5 },
    { id: "h2", label: "Gym", icon: "🏋️", goal: 4 },
    { id: "h3", label: "Reading", icon: "📖", goal: 5 },
  ],
  habitLogs: [],
  calendarEvents: [],
  goalsWeekly: [],
  goalsMonthly: [],
  nutritionLog: [],
  nutritionGoalKcal: 2200,
  financeSheetUrl: "",
};
