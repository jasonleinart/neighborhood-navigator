"use client";

import type { MatchResult, ProgramCategory } from "@/lib/types";
import { getCategoryLabel, getCategoryOrder } from "@/lib/utils";
import ProgramCard from "./ProgramCard";

interface ResultsGroupProps {
  results: MatchResult[];
  citySlug?: string;
}

export default function ResultsGroup({ results, citySlug }: ResultsGroupProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-muted-light p-8 text-center">
        <p className="text-lg font-medium text-gray-700">
          No matching programs found
        </p>
        <p className="mt-2 text-sm text-muted">
          Try adjusting your answers, or call{" "}
          <a href="tel:211" className="font-medium text-primary underline">
            211
          </a>{" "}
          to speak with someone who can help find resources in your area.
        </p>
      </div>
    );
  }

  // Group by category
  const grouped = new Map<ProgramCategory, MatchResult[]>();
  for (const result of results) {
    const cat = result.program.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(result);
  }

  // Sort categories by display order
  const sortedCategories = [...grouped.entries()].sort(
    ([a], [b]) => getCategoryOrder(a) - getCategoryOrder(b)
  );

  const strongCount = results.filter((r) => r.confidence === "strong").length;
  const likelyCount = results.filter((r) => r.confidence === "likely").length;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-4">
        <p className="text-lg font-semibold">
          {results.length} program{results.length !== 1 ? "s" : ""} found
        </p>
        <p className="text-sm text-muted">
          {strongCount > 0 && (
            <span className="text-success font-medium">
              {strongCount} strong
            </span>
          )}
          {strongCount > 0 && likelyCount > 0 && " · "}
          {likelyCount > 0 && (
            <span className="text-warning font-medium">
              {likelyCount} likely
            </span>
          )}
        </p>
      </div>

      {sortedCategories.map(([category, categoryResults]) => (
        <section key={category}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {getCategoryLabel(category)}
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-normal">
              {categoryResults.length}
            </span>
          </h2>
          <div className="space-y-3">
            {categoryResults.map((result) => (
              <ProgramCard key={result.program.id} result={result} citySlug={citySlug} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
