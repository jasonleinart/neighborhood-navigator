"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchScreenings, groupByDate, groupByField } from "@/lib/dashboard-data";
import type { ScreeningRow } from "@/lib/dashboard-data";
import { downloadCsv } from "@/lib/csv-export";

export default function ScreeningsPage() {
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScreenings()
      .then(setScreenings)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-12 text-center text-muted">Loading...</p>;
  }

  // Volume over time
  const byDate = groupByDate(screenings);
  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Breakdowns
  const byZip = groupByField(screenings, "zip");
  const byIncome = groupByField(screenings, "income_range");
  const byHousing = groupByField(screenings, "housing_status");

  function exportScreenings() {
    downloadCsv("screenings-export.csv",
      ["ID", "ZIP", "Household Size", "Income", "Housing", "Matches", "Strong", "Likely", "Opted In", "Date"],
      screenings.map((s) => [
        s.id,
        s.zip,
        String(s.household_size),
        s.income_range,
        s.housing_status,
        String(s.match_count),
        String(s.strong_count),
        String(s.likely_count),
        s.opted_into_intake ? "Yes" : "No",
        new Date(s.created_at).toLocaleDateString(),
      ])
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Screenings</h1>
        <button
          onClick={exportScreenings}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      <p className="text-sm text-muted">{screenings.length} total screenings</p>

      {/* Volume Chart */}
      {chartData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Volume Over Time</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Breakdown Tables */}
      <div className="grid gap-8 sm:grid-cols-3">
        <BreakdownTable title="By ZIP Code" data={byZip} />
        <BreakdownTable title="By Income" data={byIncome} />
        <BreakdownTable title="By Housing Status" data={byHousing} />
      </div>

      {screenings.length === 0 && (
        <div className="rounded-lg bg-muted-light p-8 text-center">
          <p className="text-sm text-muted">No screening data yet.</p>
        </div>
      )}
    </div>
  );
}

function BreakdownTable({ title, data }: { title: string; data: Record<string, number> }) {
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <div className="mt-2 space-y-1">
        {sorted.map(([key, count]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{key}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
