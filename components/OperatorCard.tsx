"use client";

import { DashboardData } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

export default function OperatorCard({ data, update }: Props) {
  const { operator } = data;

  function setField(field: keyof typeof operator, value: string | number) {
    update((d) => ({ ...d, operator: { ...d.operator, [field]: value } }));
  }

  const initials = operator.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">01 // Operator</span>
        <span className="tag" style={{ color: "var(--accent)" }}>● ONLINE</span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="mono"
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          {initials}
        </div>
        <div>
          <input
            value={operator.name}
            onChange={(e) => setField("name", e.target.value)}
            className="os-input mono"
            style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600 }}
          />
          <input
            value={operator.title}
            onChange={(e) => setField("title", e.target.value)}
            className="os-input"
            style={{ border: "none", padding: 0, fontSize: 11, color: "var(--ink-faint)" }}
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="tag">Focus</span>
        <input
          value={operator.focus}
          onChange={(e) => setField("focus", e.target.value)}
          className="os-input mt-1"
          style={{ fontStyle: "italic" }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="tag">Streak</span>
        <span className="mono text-sm">{operator.streak} days</span>
      </div>
    </div>
  );
}
