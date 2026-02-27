"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchScreenings } from "@/lib/dashboard-data";
import type { ScreeningRow } from "@/lib/dashboard-data";
import { downloadCsv } from "@/lib/csv-export";

// Map program IDs to human-readable names
// This pulls from the static program data
import detroitPrograms from "@/data/detroit/programs.json";
const programNames: Record<string, string> = {};
for (const p of detroitPrograms) {
  programNames[p.id] = p.name;
}

interface ProgramStat {
  id: string;
  name: string;
  matchCount: number;
}

export default function ProgramsPage() {
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

  // Count how often each program appears in match results
  const freq: Record<string, number> = {};
  for (const s of screenings) {
    for (const pid of s.matched_program_ids || []) {
      freq[pid] = (freq[pid] || 0) + 1;
    }
  }

  const programStats: ProgramStat[] = Object.entries(freq)
    .map(([id, matchCount]) => ({
      id,
      name: programNames[id] || id,
      matchCount,
    }))
    .sort((a, b) => b.matchCount - a.matchCount);

  const chartData = programStats.slice(0, 15).map((p) => ({
    name: p.name.length > 25 ? p.name.slice(0, 22) + "..." : p.name,
    matches: p.matchCount,
  }));

  function exportPrograms() {
    downloadCsv("program-match-rates.csv",
      ["Program ID", "Program Name", "Times Matched", "% of Screenings"],
      programStats.map((p) => [
        p.id,
        p.name,
        String(p.matchCount),
        screenings.length > 0 ? ((p.matchCount / screenings.length) * 100).toFixed(1) + "%" : "0%",
      ])
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Program Match Rates</h1>
        <button
          onClick={exportPrograms}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      <p className="text-sm text-muted">
        How often each program appears in screening results across {screenings.length} screenings.
      </p>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 160 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
              <Tooltip />
              <Bar dataKey="matches" fill="#1e40af" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full Table */}
      {programStats.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="pb-2 pr-4">Program</th>
                <th className="pb-2 pr-4 text-right">Times Matched</th>
                <th className="pb-2 text-right">% of Screenings</th>
              </tr>
            </thead>
            <tbody>
              {programStats.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4 text-right font-medium">{p.matchCount}</td>
                  <td className="py-2 text-right text-muted">
                    {screenings.length > 0 ? ((p.matchCount / screenings.length) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {programStats.length === 0 && (
        <div className="rounded-lg bg-muted-light p-8 text-center">
          <p className="text-sm text-muted">No program match data yet.</p>
        </div>
      )}
    </div>
  );
}
