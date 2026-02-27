"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findCityByZip } from "@/lib/data";

export default function HomePage() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Enter a 5-digit ZIP code.");
      return;
    }

    const city = findCityByZip(trimmed);
    if (city) {
      router.push(`/${city}?zip=${trimmed}`);
    } else {
      setError(
        "We don't have program data for that ZIP code yet. Try calling 211 for help in your area."
      );
    }
  }

  return (
    <div className="flex flex-col items-center pt-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Find programs you qualify for
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Answer a few questions about your situation and we'll show you
        assistance programs for property tax relief, home repair, utility
        bills, and more. Takes about 2 minutes.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex w-full max-w-sm flex-col gap-3"
      >
        <label htmlFor="zip" className="text-sm font-medium text-gray-700">
          What's your ZIP code?
        </label>
        <input
          id="zip"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
          placeholder="e.g. 48214"
          className="rounded-lg border border-gray-300 px-4 py-4 text-center text-lg focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary-light focus:outline-none"
        >
          Find Programs
        </button>
      </form>

      <div className="mt-12 rounded-lg bg-muted-light p-4 text-sm text-muted">
        <p>
          <strong>Your privacy:</strong> Your answers stay on your device. No
          accounts needed. We count page views anonymously to improve the tool
          — your personal answers are never sent to a server.
        </p>
      </div>
    </div>
  );
}
