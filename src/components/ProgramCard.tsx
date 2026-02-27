"use client";

import { useState } from "react";
import type { MatchResult } from "@/lib/types";
import { getCategoryLabel } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface ProgramCardProps {
  result: MatchResult;
  citySlug?: string;
}

export default function ProgramCard({ result, citySlug }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { program, confidence, bonusNotes } = result;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => {
          if (!expanded) trackEvent("program-card-expanded", { programId: program.id });
          setExpanded(!expanded);
        }}
        className="w-full px-4 py-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">{program.name}</h3>
            <p className="mt-0.5 text-sm text-muted">{program.agency}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                confidence === "strong"
                  ? "bg-success-light text-success"
                  : "bg-warning-light text-warning"
              }`}
            >
              {confidence === "strong" ? "Strong match" : "Likely match"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                program.funding_status === "open"
                  ? "bg-green-50 text-green-700"
                  : program.funding_status === "seasonal"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {program.funding_status === "open"
                ? "Open"
                : program.funding_status === "seasonal"
                ? "Seasonal"
                : "Waitlist"}
            </span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-primary-dark">
          {program.max_benefit}
        </p>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
          <div>
            <p className="text-sm text-gray-700">{program.description}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              What it covers
            </p>
            <p className="mt-1 text-sm text-gray-700">{program.covers}</p>
          </div>

          {bonusNotes.length > 0 && (
            <div className="rounded bg-blue-50 p-3">
              {bonusNotes.map((note, i) => (
                <p key={i} className="text-sm text-blue-800">
                  {note}
                </p>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Documents you'll need
            </p>
            <ul className="mt-1 space-y-1">
              {program.required_docs.map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-gray-400">&bull;</span>
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted-light p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              How to apply
            </p>
            <p className="mt-1 text-sm font-medium">{program.how_to_apply.method}</p>
            {program.how_to_apply.phone && (
              <p className="mt-1 text-sm">
                Phone:{" "}
                <a
                  href={`tel:${program.how_to_apply.phone.replace(/\D/g, "")}`}
                  className="font-medium text-primary underline"
                >
                  {program.how_to_apply.phone}
                </a>
              </p>
            )}
            {program.how_to_apply.url && (
              <p className="mt-1 text-sm">
                Website:{" "}
                <a
                  href={program.how_to_apply.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline"
                >
                  Apply online
                </a>
              </p>
            )}
            {program.how_to_apply.address && (
              <p className="mt-1 text-sm text-gray-700">
                {program.how_to_apply.address}
              </p>
            )}
            {program.how_to_apply.hours && (
              <p className="mt-1 text-sm text-muted">
                {program.how_to_apply.hours}
              </p>
            )}
            {program.how_to_apply.notes && (
              <p className="mt-2 text-sm text-gray-600 italic">
                {program.how_to_apply.notes}
              </p>
            )}
          </div>

          {program.id === "detroit-hope-poverty-tax-exemption" && citySlug && (
            <a
              href={`/${citySlug}/hope-assistant`}
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Use the HOPE Assistant
            </a>
          )}

          <p className="text-xs text-muted">
            Category: {getCategoryLabel(program.category)} &middot; Last
            verified: {program.last_verified}
          </p>
        </div>
      )}
    </div>
  );
}
