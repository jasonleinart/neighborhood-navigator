"use client";

import type { MatchResult, ResidentInput, CityMeta } from "@/lib/types";

interface PrintableResultsProps {
  results: MatchResult[];
  input: ResidentInput;
  meta: CityMeta;
}

export default function PrintableResults({
  results,
  input,
  meta,
}: PrintableResultsProps) {
  return (
    <div className="hidden print-only">
      <h1 className="text-xl font-bold">
        Your Assistance Programs — {meta.name}, {meta.state_abbr}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        ZIP: {input.zip} &middot;{" "}
        {input.housing_status === "owner" ? "Homeowner" : input.housing_status === "renter" ? "Renter" : "Other"} &middot;{" "}
        Household of {input.household_size} &middot;{" "}
        {input.is_senior && "Senior \u00B7 "}
        {input.is_veteran && "Veteran \u00B7 "}
        {input.has_disability && "Disability \u00B7 "}
        Generated {new Date().toLocaleDateString("en-US")}
      </p>

      <div className="mt-4 space-y-3">
        {results.map(({ program, confidence }) => (
          <div
            key={program.id}
            className="border-b border-gray-200 pb-2"
          >
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">{program.name}</p>
              <p className="text-xs">
                {confidence === "strong" ? "Strong match" : "Likely match"}
              </p>
            </div>
            <p className="text-sm">{program.agency}</p>
            <p className="text-sm">Benefit: {program.max_benefit}</p>
            {program.how_to_apply.phone && (
              <p className="text-sm">Phone: {program.how_to_apply.phone}</p>
            )}
            {program.how_to_apply.url && (
              <p className="text-sm">{program.how_to_apply.url}</p>
            )}
            {program.how_to_apply.notes && (
              <p className="text-xs italic text-gray-600">
                {program.how_to_apply.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-gray-300 pt-3">
        <p className="text-xs text-gray-500">
          Need more help? Call{" "}
          {meta.fallback_resource.name} at {meta.fallback_resource.phone} or
          visit {meta.fallback_resource.url}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Free legal help: {meta.legal_aid.name} at {meta.legal_aid.phone}
        </p>
      </div>
    </div>
  );
}
