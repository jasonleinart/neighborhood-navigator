"use client";

import type { MatchResult } from "@/lib/types";

interface DocumentChecklistProps {
  results: MatchResult[];
}

export default function DocumentChecklist({ results }: DocumentChecklistProps) {
  // Deduplicate documents across all matched programs
  // Track which programs need each doc
  const docMap = new Map<string, string[]>();

  for (const { program } of results) {
    for (const doc of program.required_docs) {
      // Normalize: trim and lowercase for dedup, keep original for display
      const key = doc.toLowerCase().trim();
      if (!docMap.has(key)) {
        docMap.set(key, []);
      }
      // Store program name, avoid duplicates
      const programs = docMap.get(key)!;
      if (!programs.includes(program.name)) {
        programs.push(program.name);
      }
    }
  }

  // Sort by how many programs need the doc (most-needed first)
  const sortedDocs = [...docMap.entries()]
    .sort(([, a], [, b]) => b.length - a.length);

  if (sortedDocs.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Document Checklist
      </h2>
      <p className="mt-1 text-sm text-muted">
        Gather these documents before applying. Many programs need the same
        items.
      </p>
      <ul className="mt-3 space-y-2">
        {sortedDocs.map(([key, programs]) => (
          <li key={key} className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
            />
            <div>
              <p className="text-sm text-gray-900">
                {/* Show the first original-cased version */}
                {results
                  .flatMap((r) => r.program.required_docs)
                  .find((d) => d.toLowerCase().trim() === key) ?? key}
              </p>
              {programs.length > 1 && (
                <p className="text-xs text-muted">
                  Needed for: {programs.join(", ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
