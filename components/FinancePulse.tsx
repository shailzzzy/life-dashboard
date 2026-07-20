"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/lib/types";

interface Props {
  data: DashboardData;
  update: (updater: (d: DashboardData) => DashboardData) => void;
}

interface FinanceData {
  netWorth: number;
  dailyChange: number;
  dailyChangePct: number;
  monthlyChange: number;
  monthlyChangePct: number;
  series: number[];
  updatedAt: string;
}

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const w = 260;
  const h = 60;
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  );
}

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function FinancePulse({ data, update }: Props) {
  const [fin, setFin] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState(!data.financeSheetUrl);
  const [urlInput, setUrlInput] = useState(data.financeSheetUrl);

  useEffect(() => {
    if (!data.financeSheetUrl) return;
    let cancelled = false;
    fetch(`/api/finance?url=${encodeURIComponent(data.financeSheetUrl)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) {
          setError(d.error);
          setFin(null);
        } else {
          setFin(d);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not fetch sheet");
      });
    return () => {
      cancelled = true;
    };
  }, [data.financeSheetUrl]);

  function saveUrl() {
    update((d) => ({ ...d, financeSheetUrl: urlInput.trim() }));
    setEditingUrl(false);
  }

  return (
    <div className="tile">
      <div className="tile-header">
        <span className="tile-label">05 // Finance Pulse</span>
        <button onClick={() => setEditingUrl((e) => !e)} className="icon-btn tag">
          {editingUrl ? "CLOSE" : "EDIT SOURCE"}
        </button>
      </div>

      {editingUrl && (
        <div className="flex gap-2 mb-3">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Published Google Sheet CSV URL..."
            className="os-input flex-1 text-xs"
          />
          <button onClick={saveUrl} className="icon-btn mono text-xs">SAVE</button>
        </div>
      )}

      {!data.financeSheetUrl && !editingUrl && (
        <div className="tile-sub">No sheet connected. Click &quot;Edit source&quot; to add one.</div>
      )}

      {data.financeSheetUrl && error && <div className="tile-sub" style={{ color: "var(--accent-red)" }}>{error}</div>}

      {fin && !error && (
        <>
          <div className="flex items-baseline gap-2">
            <span className={`tag ${fin.dailyChange >= 0 ? "" : ""}`} style={{ color: fin.dailyChange >= 0 ? "var(--accent)" : "var(--accent-red)" }}>
              {fin.dailyChange >= 0 ? "▲" : "▼"} {Math.abs(fin.dailyChangePct).toFixed(2)}%
            </span>
          </div>
          <div className="text-3xl font-semibold mono mt-1">{fmtMoney(fin.netWorth)}</div>
          <div className="mt-2">
            <Sparkline series={fin.series} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="habit-chip">
              <div className="tag">Daily</div>
              <div className="mono text-sm mt-1" style={{ color: fin.dailyChange >= 0 ? "var(--accent)" : "var(--accent-red)" }}>
                {fin.dailyChange >= 0 ? "+" : ""}{fmtMoney(fin.dailyChange)}
              </div>
            </div>
            <div className="habit-chip">
              <div className="tag">Monthly</div>
              <div className="mono text-sm mt-1" style={{ color: fin.monthlyChange >= 0 ? "var(--accent)" : "var(--accent-red)" }}>
                {fin.monthlyChange >= 0 ? "+" : ""}{fmtMoney(fin.monthlyChange)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
