"use client";

import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchScreenings, fetchIntakes } from "@/lib/dashboard-data";
import type { ScreeningRow, IntakeRow } from "@/lib/dashboard-data";
import { downloadCsv } from "@/lib/csv-export";

import detroitPrograms from "@/data/detroit/programs.json";
const programNames: Record<string, string> = {};
for (const p of detroitPrograms) {
  programNames[p.id] = p.name;
}

interface GapRow {
  programId: string;
  programName: string;
  matched: number;
  intakeStarted: number;
  applied: number;
  served: number;
  gap: number;
}

export default function GapPage() {
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedOutcomes, setUploadedOutcomes] = useState<Record<string, { applied: number; served: number }>>({});

  useEffect(() => {
    Promise.all([fetchScreenings(), fetchIntakes()])
      .then(([s, i]) => {
        setScreenings(s);
        setIntakes(i);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const outcomes: Record<string, { applied: number; served: number }> = {};
        for (const row of results.data as Record<string, string>[]) {
          const pid = row.program_id || row.Program_ID || row.programId || "";
          const applied = parseInt(row.applied || row.Applied || "0", 10) || 0;
          const served = parseInt(row.served || row.Served || "0", 10) || 0;
          if (pid) {
            outcomes[pid] = { applied, served };
          }
        }
        setUploadedOutcomes(outcomes);
      },
    });
  }, []);

  if (loading) {
    return <p className="py-12 text-center text-muted">Loading...</p>;
  }

  // Build gap analysis
  // Step 1: Count how many times each program was matched in screenings
  const matchCounts: Record<string, number> = {};
  for (const s of screenings) {
    for (const pid of s.matched_program_ids || []) {
      matchCounts[pid] = (matchCounts[pid] || 0) + 1;
    }
  }

  // Step 2: Count intakes that include each program
  const intakeCounts: Record<string, number> = {};
  for (const intake of intakes) {
    for (const mp of intake.matched_programs || []) {
      intakeCounts[mp.id] = (intakeCounts[mp.id] || 0) + 1;
    }
  }

  // Step 3: Merge with uploaded outcome data
  const allProgramIds = new Set([
    ...Object.keys(matchCounts),
    ...Object.keys(intakeCounts),
    ...Object.keys(uploadedOutcomes),
  ]);

  const gapData: GapRow[] = Array.from(allProgramIds)
    .map((pid) => {
      const matched = matchCounts[pid] || 0;
      const intakeStarted = intakeCounts[pid] || 0;
      const applied = uploadedOutcomes[pid]?.applied || 0;
      const served = uploadedOutcomes[pid]?.served || 0;
      return {
        programId: pid,
        programName: programNames[pid] || pid,
        matched,
        intakeStarted,
        applied,
        served,
        gap: matched - served,
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const chartData = gapData.slice(0, 12).map((g) => ({
    name: g.programName.length > 20 ? g.programName.slice(0, 17) + "..." : g.programName,
    Screened: g.matched,
    Intake: g.intakeStarted,
    Applied: g.applied,
    Served: g.served,
  }));

  // Summary stats
  const totalScreened = screenings.length;
  const totalIntakes = intakes.length;
  const totalApplied = Object.values(uploadedOutcomes).reduce((s, o) => s + o.applied, 0);
  const totalServed = Object.values(uploadedOutcomes).reduce((s, o) => s + o.served, 0);

  function exportGap() {
    downloadCsv("gap-analysis.csv",
      ["Program ID", "Program Name", "Times Matched", "Intakes Started", "Applied", "Served", "Unmet Gap"],
      gapData.map((g) => [
        g.programId,
        g.programName,
        String(g.matched),
        String(g.intakeStarted),
        String(g.applied),
        String(g.served),
        String(g.gap),
      ])
    );
  }

  function exportFunderReport() {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const reportName = `funder-report-Q${quarter}-${now.getFullYear()}.csv`;

    downloadCsv(reportName,
      ["Metric", "Value"],
      [
        ["Report Period", `Q${quarter} ${now.getFullYear()}`],
        ["Total Residents Screened", String(totalScreened)],
        ["Residents Who Started Intake", String(totalIntakes)],
        ["Applications Submitted", String(totalApplied)],
        ["Residents Served", String(totalServed)],
        ["Screening → Intake Rate", totalScreened > 0 ? ((totalIntakes / totalScreened) * 100).toFixed(1) + "%" : "N/A"],
        ["Screening → Served Rate", totalScreened > 0 ? ((totalServed / totalScreened) * 100).toFixed(1) + "%" : "N/A"],
        [""],
        ["--- Program Breakdown ---", ""],
        ...gapData.map((g) => [g.programName, `Matched: ${g.matched}, Intake: ${g.intakeStarted}, Applied: ${g.applied}, Served: ${g.served}, Gap: ${g.gap}`]),
      ]
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gap Analysis</h1>
        <div className="flex gap-2">
          <button
            onClick={exportFunderReport}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Funder Report
          </button>
          <button
            onClick={exportGap}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <p className="text-sm text-muted">
        Compares screening demand (how many residents match) against actual outcomes (applied, served).
        Upload outcome data from your CRM to see the full picture.
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Screened" value={totalScreened} />
        <StatCard label="Intakes" value={totalIntakes} />
        <StatCard label="Applied" value={totalApplied} note={totalApplied === 0 ? "Upload CSV" : undefined} />
        <StatCard label="Served" value={totalServed} note={totalServed === 0 ? "Upload CSV" : undefined} />
      </div>

      {/* CSV Upload */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
        <p className="text-sm font-medium text-gray-700">Upload Outcome Data</p>
        <p className="mt-1 text-xs text-muted">
          CSV with columns: <code className="rounded bg-gray-100 px-1">program_id</code>,{" "}
          <code className="rounded bg-gray-100 px-1">applied</code>,{" "}
          <code className="rounded bg-gray-100 px-1">served</code>
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="mt-3 text-sm"
        />
        {Object.keys(uploadedOutcomes).length > 0 && (
          <p className="mt-2 text-xs text-green-700">
            Loaded outcome data for {Object.keys(uploadedOutcomes).length} programs.
          </p>
        )}
      </div>

      {/* Gap Chart */}
      {chartData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Screened vs. Served</h2>
          <div className="mt-3 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 140 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Screened" fill="#93c5fd" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Intake" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Applied" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Served" fill="#1e40af" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gap Table */}
      {gapData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="pb-2 pr-4">Program</th>
                <th className="pb-2 pr-4 text-right">Matched</th>
                <th className="pb-2 pr-4 text-right">Intake</th>
                <th className="pb-2 pr-4 text-right">Applied</th>
                <th className="pb-2 pr-4 text-right">Served</th>
                <th className="pb-2 text-right">Gap</th>
              </tr>
            </thead>
            <tbody>
              {gapData.map((g) => (
                <tr key={g.programId} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{g.programName}</td>
                  <td className="py-2 pr-4 text-right">{g.matched}</td>
                  <td className="py-2 pr-4 text-right">{g.intakeStarted}</td>
                  <td className="py-2 pr-4 text-right">{g.applied}</td>
                  <td className="py-2 pr-4 text-right">{g.served}</td>
                  <td className="py-2 text-right font-medium text-red-600">{g.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {note && <p className="mt-1 text-xs text-muted italic">{note}</p>}
    </div>
  );
}
