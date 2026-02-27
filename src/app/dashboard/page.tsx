"use client";

import { useState, useEffect } from "react";
import { fetchScreenings, fetchIntakes } from "@/lib/dashboard-data";
import type { ScreeningRow, IntakeRow } from "@/lib/dashboard-data";
import { downloadCsv } from "@/lib/csv-export";

export default function DashboardOverview() {
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchScreenings(), fetchIntakes()])
      .then(([s, i]) => {
        setScreenings(s);
        setIntakes(i);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-12 text-center text-muted">Loading dashboard...</p>;
  }

  const totalScreenings = screenings.length;
  const totalIntakes = intakes.length;
  const conversionRate = totalScreenings > 0 ? ((totalIntakes / totalScreenings) * 100).toFixed(1) : "0";
  const avgMatchCount = totalScreenings > 0
    ? (screenings.reduce((sum, s) => sum + s.match_count, 0) / totalScreenings).toFixed(1)
    : "0";
  const totalStrongMatches = screenings.reduce((sum, s) => sum + s.strong_count, 0);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const intake of intakes) {
    statusCounts[intake.status] = (statusCounts[intake.status] || 0) + 1;
  }

  // Recent intakes
  const recentIntakes = intakes.slice(0, 10);

  function exportOverview() {
    downloadCsv("dashboard-overview.csv",
      ["Metric", "Value"],
      [
        ["Total Screenings", String(totalScreenings)],
        ["Total Intakes", String(totalIntakes)],
        ["Conversion Rate", `${conversionRate}%`],
        ["Avg Programs Matched", avgMatchCount],
        ["Total Strong Matches", String(totalStrongMatches)],
        ...Object.entries(statusCounts).map(([status, count]) => [`Intakes: ${status}`, String(count)]),
      ]
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={exportOverview}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="Screenings" value={totalScreenings} />
        <Card label="Intakes" value={totalIntakes} />
        <Card label="Conversion" value={`${conversionRate}%`} />
        <Card label="Avg Matches" value={avgMatchCount} />
      </div>

      {/* Intake Status Breakdown */}
      {Object.keys(statusCounts).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Intake Status</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Intakes */}
      {recentIntakes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Recent Intakes</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Phone</th>
                  <th className="pb-2 pr-4">Programs</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentIntakes.map((intake) => (
                  <tr key={intake.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{intake.first_name}</td>
                    <td className="py-2 pr-4">{intake.phone}</td>
                    <td className="py-2 pr-4">{(intake.matched_programs || []).length}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={intake.status} />
                    </td>
                    <td className="py-2 text-muted">
                      {new Date(intake.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalScreenings === 0 && (
        <div className="rounded-lg bg-muted-light p-8 text-center">
          <p className="text-lg font-medium text-gray-700">No data yet</p>
          <p className="mt-2 text-sm text-muted">
            Screenings will appear here once residents start using the tool.
          </p>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    contacted: "bg-yellow-50 text-yellow-700",
    applied: "bg-purple-50 text-purple-700",
    served: "bg-green-50 text-green-700",
    declined: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
