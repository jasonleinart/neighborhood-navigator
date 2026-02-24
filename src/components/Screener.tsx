"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCityData } from "@/lib/data";
import { matchPrograms } from "@/lib/matcher";
import { INCOME_RANGE_LABELS } from "@/lib/utils";
import type {
  ResidentInput,
  IncomeRange,
  HousingStatus,
  PropertyType,
  TaxStatus,
  PropertyIssue,
  MatchResult,
  UtilityProvider,
} from "@/lib/types";
import StepIndicator from "@/components/StepIndicator";
import ResultsGroup from "@/components/ResultsGroup";
import DocumentChecklist from "@/components/DocumentChecklist";
import PrintableResults from "@/components/PrintableResults";

const INITIAL_INPUT: ResidentInput = {
  zip: "",
  housing_status: "owner",
  household_size: 1,
  income_range: "under_25k",
  is_veteran: false,
  is_senior: false,
  property_type: "single_family",
  tax_status: "current",
  issues: [],
  utility_arrears: false,
  has_disability: false,
  has_young_children: false,
  interested_in_buying: false,
  utility_provider: "not_sure",
};

export default function Screener({ citySlug }: { citySlug: string }) {
  const searchParams = useSearchParams();
  const cityData = getCityData(citySlug);
  const zipFromUrl = searchParams.get("zip") || "";

  const [step, setStep] = useState(1);
  const [editingZip, setEditingZip] = useState(!zipFromUrl);
  const [input, setInput] = useState<ResidentInput>({
    ...INITIAL_INPUT,
    zip: zipFromUrl,
  });
  const [results, setResults] = useState<MatchResult[] | null>(null);

  if (!cityData) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted">City not found.</p>
        <a href="/" className="mt-4 inline-block text-primary underline">
          Go back
        </a>
      </div>
    );
  }

  function update<K extends keyof ResidentInput>(field: K, value: ResidentInput[K]) {
    setInput((prev) => ({ ...prev, [field]: value }));
  }

  function toggleIssue(issue: PropertyIssue) {
    setInput((prev) => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter((i) => i !== issue)
        : [...prev.issues, issue],
    }));
  }

  const zipIsValid = input.zip.length === 5;
  const zipInCity = cityData.meta.valid_zips.includes(input.zip);

  function handleNext() {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      if (!zipIsValid) return; // require ZIP before matching
      const matched = matchPrograms(input, cityData!.programs);
      setResults(matched);
      setStep(4);
    }
  }

  function handleBack() {
    if (step > 1) {
      if (step === 4) setResults(null);
      setStep(step - 1);
    }
  }

  function handleStepClick(target: number) {
    if (target >= step) return; // only allow going backward
    if (step === 4) setResults(null); // clear stale results when leaving step 4
    setStep(target);
  }

  return (
    <div>
      <StepIndicator currentStep={step} onStepClick={handleStepClick} />

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Situation</h2>

          <fieldset>
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
              ZIP code
            </label>
            {!editingZip && input.zip.length === 5 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-medium">{input.zip}</span>
                <button
                  type="button"
                  onClick={() => setEditingZip(true)}
                  className="text-sm text-primary underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  id="zip"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={input.zip}
                  onChange={(e) => update("zip", e.target.value.replace(/\D/g, ""))}
                  className={`mt-1 w-32 rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none ${
                    input.zip.length === 5 && !zipInCity
                      ? "border-warning focus:border-warning focus:ring-warning-light"
                      : "border-gray-300 focus:border-primary focus:ring-primary-light"
                  }`}
                />
                {input.zip.length === 5 && !zipInCity && (
                  <p className="mt-1 text-sm text-warning">
                    This ZIP code isn&apos;t in our {cityData.meta.name} database. Results may be limited for ZIP-specific programs.
                  </p>
                )}
                {input.zip.length > 0 && input.zip.length < 5 && (
                  <p className="mt-1 text-sm text-muted">
                    Enter a 5-digit ZIP code
                  </p>
                )}
              </>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Do you own or rent your home?
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(
                [
                  ["owner", "I own my home"],
                  ["renter", "I rent"],
                  ["other", "Other"],
                ] as [HousingStatus, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    input.housing_status === value
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="housing_status"
                    value={value}
                    checked={input.housing_status === value}
                    onChange={() => update("housing_status", value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

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
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Household</h2>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              What is your total household income (before taxes)?
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              {(Object.entries(INCOME_RANGE_LABELS) as [IncomeRange, string][]).map(
                ([value, label]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      input.income_range === value
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="income_range"
                      value={value}
                      checked={input.income_range === value}
                      onChange={() => update("income_range", value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                )
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Is anyone in your household a veteran?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.is_veteran === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="is_veteran"
                    checked={input.is_veteran === val}
                    onChange={() => update("is_veteran", val)}
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
              Does anyone in your household have a disability?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.has_disability === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="has_disability"
                    checked={input.has_disability === val}
                    onChange={() => update("has_disability", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Are there any children under 6 in your household?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.has_young_children === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="has_young_children"
                    checked={input.has_young_children === val}
                    onChange={() => update("has_young_children", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Are you interested in buying a home?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.interested_in_buying === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="interested_in_buying"
                    checked={input.interested_in_buying === val}
                    onChange={() => update("interested_in_buying", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Who is your electric utility provider?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["dte", "DTE Energy"],
                  ["consumers", "Consumers Energy"],
                  ["other", "Other"],
                  ["not_sure", "Not sure"],
                ] as [UtilityProvider, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    input.utility_provider === value
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="utility_provider"
                    value={value}
                    checked={input.utility_provider === value}
                    onChange={() => update("utility_provider", value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Home</h2>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              What type of property do you live in?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["single_family", "Single family house"],
                  ["duplex", "Duplex"],
                  ["apartment", "Apartment"],
                  ["condo", "Condo"],
                  ["mobile_home", "Mobile home"],
                ] as [PropertyType, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    input.property_type === value
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="property_type"
                    value={value}
                    checked={input.property_type === value}
                    onChange={() => update("property_type", value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Are you current on your property taxes?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["current", "Yes, current"],
                  ["delinquent", "No, behind"],
                  ["in_foreclosure", "In foreclosure"],
                  ["not_sure", "Not sure"],
                ] as [TaxStatus, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    input.tax_status === value
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="tax_status"
                    value={value}
                    checked={input.tax_status === value}
                    onChange={() => update("tax_status", value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Does your home have any of these issues? (check all that apply)
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              {(
                [
                  ["lead_paint", "Lead paint (or not sure)"],
                  ["roof_structural", "Roof or structural damage"],
                  ["plumbing_electrical", "Plumbing or electrical problems"],
                  ["heating_insulation", "Heating or insulation problems"],
                ] as [PropertyIssue, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    input.issues.includes(value)
                      ? "border-primary bg-blue-50 text-primary-dark"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={input.issues.includes(value)}
                    onChange={() => toggleIssue(value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">
              Are you behind on utility bills (gas, electric, or water)?
            </legend>
            <div className="mt-2 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-colors ${
                    input.utility_arrears === val
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="utility_arrears"
                    checked={input.utility_arrears === val}
                    onChange={() => update("utility_arrears", val)}
                    className="sr-only"
                  />
                  {val ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {step === 4 && results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Programs</h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Print My Results
            </button>
          </div>

          <ResultsGroup results={results} citySlug={citySlug} />
          <DocumentChecklist results={results} />

          <div className="rounded-lg bg-muted-light p-4 text-sm text-muted no-print">
            <p className="font-medium text-gray-700">Need more help?</p>
            <p className="mt-1">
              Call{" "}
              <a href="tel:211" className="font-medium text-primary underline">
                211
              </a>{" "}
              to speak with someone who can connect you to resources.
            </p>
            <p className="mt-1">
              Free legal help:{" "}
              <a
                href={`tel:${cityData.meta.legal_aid.phone.replace(/\D/g, "")}`}
                className="font-medium text-primary underline"
              >
                {cityData.meta.legal_aid.name} ({cityData.meta.legal_aid.phone})
              </a>
            </p>
            <p className="mt-1">
              Free tax prep:{" "}
              <a
                href={`tel:${cityData.meta.tax_prep.phone.replace(/\D/g, "")}`}
                className="font-medium text-primary underline"
              >
                {cityData.meta.tax_prep.name} ({cityData.meta.tax_prep.phone})
              </a>
            </p>
          </div>

          <PrintableResults results={results} input={input} meta={cityData.meta} />
        </div>
      )}

      {step < 4 && (
        <div className="mt-8">
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
              disabled={step === 3 && !zipIsValid}
              className={`rounded-lg px-8 py-3 text-sm font-semibold focus:ring-2 focus:outline-none ${
                step === 3 && !zipIsValid
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-dark focus:ring-primary-light"
              }`}
            >
              {step === 3 ? "Find My Programs" : "Next"}
            </button>
          </div>
          {step === 3 && !zipIsValid && (
            <p className="mt-2 text-right text-sm text-warning">
              Enter your ZIP code on Step 1 before searching
            </p>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 no-print">
          <button
            type="button"
            onClick={() => {
              setResults(null);
              setStep(1);
            }}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
