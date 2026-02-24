"use client";

import { useState, useRef } from "react";
import type { HopeData, HopeInput, HopeResult, OwnershipType } from "@/lib/hope-types";
import { calculateHope } from "@/lib/hope-calculator";

const STEP_LABELS = ["Quick Qualifier", "Your Situation", "Your Result", "Print Packet"];

const INITIAL_INPUT: HopeInput = {
  household_size: 1,
  annual_income: 0,
  total_assets: 0,
  ownership_type: "deed",
  files_taxes: true,
  is_senior: false,
  facing_foreclosure: false,
  income_dropped_20pct: false,
};

interface HopeAssistantProps {
  hopeData: HopeData;
  citySlug: string;
}

export default function HopeAssistant({ hopeData, citySlug }: HopeAssistantProps) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<HopeInput>(INITIAL_INPUT);
  const [result, setResult] = useState<HopeResult | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Set<number>>(new Set());
  const [packetName, setPacketName] = useState("");
  const [packetAddress, setPacketAddress] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof HopeInput>(field: K, value: HopeInput[K]) {
    setInput((prev) => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    if (step === 2) {
      const calc = calculateHope(input, hopeData);
      setResult(calc);
      setStep(3);
    } else if (step < 4) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 1) {
      if (step === 3) setResult(null);
      setStep(step - 1);
    }
  }

  function handleStepClick(target: number) {
    if (target >= step) return;
    if (step === 3 || step === 4) setResult(null);
    setStep(target);
  }

  function toggleDoc(index: number) {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function goToPacket() {
    setStep(4);
  }

  const incomeValid = input.annual_income > 0;

  function formatDollars(n: number): string {
    return "$" + n.toLocaleString("en-US");
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div>
      {/* Step Indicator */}
      <nav className="mb-8 no-print" aria-label="Progress">
        <ol className="flex items-center gap-2">
          {STEP_LABELS.map((label, index) => {
            const s = index + 1;
            const isCompleted = s < step;
            const isCurrent = s === step;
            const isFuture = s > step;

            return (
              <li key={s} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => s < step && handleStepClick(s)}
                  disabled={isFuture}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isCompleted
                      ? "text-primary cursor-pointer hover:text-primary-dark"
                      : isCurrent
                      ? "text-gray-900"
                      : "text-gray-400 cursor-default"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCompleted
                        ? "bg-primary text-white"
                        : isCurrent
                        ? "border-2 border-primary text-primary"
                        : "border-2 border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? "\u2713" : s}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {index < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isCompleted ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step 1: Quick Qualifier */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">HOPE Tax Exemption Assistant</h2>
            <p className="mt-2 text-sm text-muted">
              Answer a few questions to find out your exemption level, what documents you need,
              and how to apply. This takes about 2 minutes.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              How many people live in your household?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <label
                  key={n}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    input.household_size === n
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="household_size"
                    value={n}
                    checked={input.household_size === n}
                    onChange={() => update("household_size", n)}
                    className="sr-only"
                  />
                  {n}{n === 8 ? "+" : ""}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              How do you own your home?
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(
                [
                  ["deed", "I have a deed (my name is on the title)"],
                  ["land_contract", "I have a land contract"],
                ] as [OwnershipType, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    input.ownership_type === value
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="ownership_type"
                    value={value}
                    checked={input.ownership_type === value}
                    onChange={() => update("ownership_type", value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <label htmlFor="annual_income" className="block text-sm font-medium text-gray-700">
              What is your total annual household income (before taxes)?
            </label>
            <div className="mt-1 relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="annual_income"
                type="text"
                inputMode="numeric"
                value={input.annual_income === 0 ? "" : input.annual_income.toLocaleString("en-US")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  update("annual_income", raw ? parseInt(raw, 10) : 0);
                }}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Include all income: wages, Social Security, pensions, disability, child support, etc.
            </p>
          </fieldset>

          <fieldset>
            <label htmlFor="total_assets" className="block text-sm font-medium text-gray-700">
              What are your total household assets? (excluding your home and one car)
            </label>
            <div className="mt-1 relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="total_assets"
                type="text"
                inputMode="numeric"
                value={input.total_assets === 0 ? "" : input.total_assets.toLocaleString("en-US")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  update("total_assets", raw ? parseInt(raw, 10) : 0);
                }}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Bank accounts, savings, investments, additional vehicles. Your home and one car are excluded.
              The limit is {formatDollars(hopeData.asset_limit)}.
            </p>
            {input.total_assets > hopeData.asset_limit && (
              <p className="mt-1 text-sm text-warning">
                Assets above {formatDollars(hopeData.asset_limit)} may disqualify you from HOPE. You can still continue to check.
              </p>
            )}
          </fieldset>
        </div>
      )}

      {/* Step 2: Your Situation */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Situation</h2>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Do you file federal and state tax returns?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.files_taxes === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="files_taxes"
                    checked={input.files_taxes === val}
                    onChange={() => update("files_taxes", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Is anyone in your household 62 or older?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.is_senior === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="is_senior"
                    checked={input.is_senior === val}
                    onChange={() => update("is_senior", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Are you currently facing tax foreclosure on your home?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.facing_foreclosure === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="facing_foreclosure"
                    checked={input.facing_foreclosure === val}
                    onChange={() => update("facing_foreclosure", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Did your household income drop 20% or more from last year?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.income_dropped_20pct === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="income_dropped"
                    checked={input.income_dropped_20pct === val}
                    onChange={() => update("income_dropped_20pct", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {/* Step 3: Your Result */}
      {step === 3 && result && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Result</h2>

          {/* Exemption Result */}
          {result.exemption_level && result.asset_eligible ? (
            <div className="rounded-lg border-2 border-green-300 bg-green-50 p-5">
              <p className="text-lg font-bold text-green-800">
                You may qualify for a {result.exemption_level}% property tax exemption
              </p>
              {result.estimated_savings && (
                <p className="mt-1 text-sm text-green-700">
                  Estimated savings: {formatDollars(result.estimated_savings.low)} to{" "}
                  {formatDollars(result.estimated_savings.high)} per year
                  <span className="text-green-600"> (based on typical Detroit tax bills)</span>
                </p>
              )}
              {result.special_10pct && result.special_10pct_reason && (
                <p className="mt-2 text-sm text-green-700 italic">
                  {result.special_10pct_reason}
                </p>
              )}
            </div>
          ) : !result.asset_eligible ? (
            <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-5">
              <p className="text-lg font-bold text-yellow-800">
                Your assets may be above the HOPE limit
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                HOPE requires total household assets (excluding your home and one car) to be
                under {formatDollars(hopeData.asset_limit)}. You reported{" "}
                {formatDollars(input.total_assets)}.
              </p>
              <p className="mt-2 text-sm text-yellow-700">
                If you think there is an error, the Board of Review can still consider your
                application. You can also call{" "}
                <a href="tel:211" className="font-medium underline">211</a> for help.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-5">
              <p className="text-lg font-bold text-gray-800">
                Your income is above the HOPE thresholds
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Based on a household of {input.household_size} with{" "}
                {formatDollars(input.annual_income)} annual income, you are above the income
                limits for all exemption levels.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                If your situation has changed recently (job loss, medical emergency), contact the
                Board of Review directly or call{" "}
                <a href="tel:211" className="font-medium text-primary underline">211</a> to
                discuss your options.
              </p>
            </div>
          )}

          {/* Document Checklist */}
          <div>
            <h3 className="text-lg font-semibold">Documents You Need</h3>
            <p className="mt-1 text-sm text-muted">
              Check off each item as you gather it. This list is personalized to your situation.
            </p>
            <ul className="mt-3 space-y-2">
              {result.documents_needed.map((doc, i) => (
                <li key={i}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkedDocs.has(i)}
                      onChange={() => toggleDoc(i)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary"
                    />
                    <span
                      className={`text-sm ${
                        checkedDocs.has(i) ? "text-muted line-through" : "text-gray-700"
                      }`}
                    >
                      {doc}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Deadlines */}
          {result.next_deadline && (
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-blue-900">Deadlines</h3>
              <p className="mt-1 text-sm text-blue-800">
                <span className="font-medium">HOPE application deadline:</span>{" "}
                {result.next_deadline.hope_deadline_label}
              </p>
              <p className="mt-1 text-sm text-blue-800">
                <span className="font-medium">
                  Next Board of Review ({result.next_deadline.session.label}):
                </span>{" "}
                {result.next_deadline.session.dates.map(formatDate).join(", ")}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                {result.next_deadline.session.description}
              </p>
            </div>
          )}

          {/* How to Submit */}
          <div>
            <h3 className="text-lg font-semibold">How to Submit</h3>
            <div className="mt-2 space-y-3">
              {hopeData.filing_methods.map((method, i) => (
                <div key={i} className="rounded-lg bg-muted-light p-3">
                  <p className="text-sm font-medium">{method.method}</p>
                  <p className="mt-0.5 text-sm text-muted">{method.description}</p>
                  {method.url && (
                    <p className="mt-1 text-sm">
                      <a
                        href={method.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline"
                      >
                        Go to E-HOPE portal
                      </a>
                    </p>
                  )}
                  {method.address && (
                    <p className="mt-1 text-sm text-gray-700">{method.address}</p>
                  )}
                  {method.phone && (
                    <p className="mt-1 text-sm">
                      Phone:{" "}
                      <a
                        href={`tel:${method.phone.replace(/\D/g, "")}`}
                        className="font-medium text-primary underline"
                      >
                        {method.phone}
                      </a>
                    </p>
                  )}
                  {method.hours && (
                    <p className="mt-1 text-xs text-muted">{method.hours}</p>
                  )}
                  {method.email && (
                    <p className="mt-1 text-sm">
                      Email:{" "}
                      <a
                        href={`mailto:${method.email}`}
                        className="font-medium text-primary underline"
                      >
                        {method.email}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assistance Partners */}
          <div>
            <h3 className="text-lg font-semibold">Need Help With Your Application?</h3>
            <p className="mt-1 text-sm text-muted">
              These Detroit Housing Network partners can help you fill out and submit your HOPE application for free.
            </p>

            {/* Helpline */}
            <div className="mt-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary">{hopeData.helpline.name}</p>
              <p className="mt-0.5 text-sm text-muted">{hopeData.helpline.note}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-sm">
                <a
                  href={`tel:${hopeData.helpline.phone.replace(/\D/g, "")}`}
                  className="text-lg font-bold text-primary underline"
                >
                  {hopeData.helpline.phone}
                </a>
                <a
                  href={hopeData.helpline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline"
                >
                  Website
                </a>
              </div>
            </div>

            {/* Partners grouped by zone */}
            {(["east", "west", "south"] as const).map((zone) => {
              const partners = hopeData.assistance_partners.filter((p) => p.zone === zone);
              if (partners.length === 0) return null;
              const zoneLabels = { east: "East Side", west: "West Side", south: "Southwest" };
              return (
                <div key={zone} className="mt-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {zoneLabels[zone]}
                  </h4>
                  <div className="mt-2 space-y-2">
                    {partners.map((partner, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-sm font-medium">{partner.name}</p>
                        <p className="mt-0.5 text-sm text-muted">{partner.services}</p>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm">
                          <a
                            href={`tel:${partner.phone.replace(/\D/g, "")}`}
                            className="font-medium text-primary underline"
                          >
                            {partner.phone}
                          </a>
                          <a
                            href={partner.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline"
                          >
                            Website
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Go to Packet button */}
          {result.exemption_level && result.asset_eligible && (
            <div className="no-print">
              <button
                type="button"
                onClick={goToPacket}
                className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary-light focus:outline-none"
              >
                Create Printable Packet Cover Sheet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Printable Packet Cover Sheet */}
      {step === 4 && result && result.exemption_level && (
        <div>
          <div className="mb-4 flex items-center justify-between no-print">
            <h2 className="text-2xl font-bold">Packet Cover Sheet</h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Print This Page
            </button>
          </div>

          <div ref={printRef} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-xl font-bold">HOPE Poverty Exemption Application Packet</h1>
              <p className="mt-1 text-sm text-muted">City of Detroit, {hopeData.year} Tax Year</p>
            </div>

            {/* Resident Info */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Applicant Information
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="packet_name" className="block text-xs text-muted">Name</label>
                  <input
                    id="packet_name"
                    type="text"
                    value={packetName}
                    onChange={(e) => setPacketName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary-light focus:outline-none no-print"
                  />
                  <p className="mt-0.5 hidden text-sm font-medium print-only">
                    {packetName || "________________________________"}
                  </p>
                </div>
                <div>
                  <label htmlFor="packet_address" className="block text-xs text-muted">Property Address</label>
                  <input
                    id="packet_address"
                    type="text"
                    value={packetAddress}
                    onChange={(e) => setPacketAddress(e.target.value)}
                    placeholder="Your property address"
                    className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary-light focus:outline-none no-print"
                  />
                  <p className="mt-0.5 hidden text-sm font-medium print-only">
                    {packetAddress || "________________________________"}
                  </p>
                </div>
              </div>
            </div>

            {/* Exemption Details */}
            <div className="rounded bg-green-50 p-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Exemption Details
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <p className="text-gray-600">Household size:</p>
                <p className="font-medium">{input.household_size}</p>
                <p className="text-gray-600">Annual income:</p>
                <p className="font-medium">{formatDollars(input.annual_income)}</p>
                <p className="text-gray-600">Total assets:</p>
                <p className="font-medium">{formatDollars(input.total_assets)}</p>
                <p className="text-gray-600">Exemption level:</p>
                <p className="font-bold text-green-800">{result.exemption_level}%</p>
                {result.estimated_savings && (
                  <>
                    <p className="text-gray-600">Estimated savings:</p>
                    <p className="font-medium">
                      {formatDollars(result.estimated_savings.low)} - {formatDollars(result.estimated_savings.high)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Board of Review Target */}
            {result.next_deadline && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Board of Review Session
                </h2>
                <p className="mt-1 text-sm">
                  Targeting: <span className="font-medium">{result.next_deadline.session.label}</span>
                </p>
                <p className="text-sm">
                  HOPE deadline: <span className="font-medium">{result.next_deadline.hope_deadline_label}</span>
                </p>
              </div>
            )}

            {/* Document Checklist for Print */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Document Checklist
              </h2>
              <ul className="mt-2 space-y-1.5">
                {result.documents_needed.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-gray-400" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="border-t border-gray-200 pt-3 text-xs text-muted">
              <p>
                Questions? Call the Taxpayer Service Center at (313) 224-3560 or visit{" "}
                <span className="text-primary">detroitmi.gov/hope</span>
              </p>
              <p className="mt-1">
                Generated by Neighborhood Navigator. This is a guide only and does not
                guarantee eligibility. The Board of Review makes the final determination.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {step < 3 && (
        <div className="mt-8 no-print">
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && !incomeValid}
              className={`rounded-lg px-8 py-3 text-sm font-semibold focus:ring-2 focus:outline-none ${
                step === 1 && !incomeValid
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-dark focus:ring-primary-light"
              }`}
            >
              {step === 2 ? "Calculate My Exemption" : "Next"}
            </button>
          </div>
          {step === 1 && !incomeValid && (
            <p className="mt-2 text-right text-sm text-warning">
              Enter your annual income to continue
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mt-8 no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <a
              href={`/${citySlug}`}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Screener
            </a>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Results
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setStep(1);
                setCheckedDocs(new Set());
              }}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
