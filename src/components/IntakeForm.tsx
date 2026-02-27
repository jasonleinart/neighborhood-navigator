"use client";

import { useState } from "react";
import type { MatchResult, ResidentInput, TenantConfig } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

interface IntakeFormProps {
  tenant: TenantConfig;
  results: MatchResult[];
  screeningInputs: ResidentInput;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function IntakeForm({ tenant, results, screeningInputs }: IntakeFormProps) {
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState<"phone" | "text" | "email">("phone");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !firstName.trim() || !phone.trim()) return;

    setState("submitting");
    trackEvent("intake-submitted", { tenant: tenant.slug });

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: tenant.slug,
          first_name: firstName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          contact_method: contactMethod,
          screening_inputs: screeningInputs,
          matched_programs: results.map((r) => ({
            id: r.program.id,
            name: r.program.name,
            confidence: r.confidence,
          })),
          manager_email: tenant.managerEmail || null,
          webhook_url: tenant.webhook?.url || null,
        }),
      });

      if (!res.ok) throw new Error("Submit failed");
      setState("success");
      trackEvent("intake-success", { tenant: tenant.slug });
    } catch {
      setState("error");
      trackEvent("intake-error", { tenant: tenant.slug });
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
        <p className="text-lg font-semibold text-green-800">We got your information.</p>
        <p className="mt-2 text-sm text-green-700">
          Someone from {tenant.shortName} will reach out to you {tenant.contactPromise}.
          Have your documents ready if you can.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-blue-50 p-6 no-print">
      <h3 className="text-lg font-bold text-gray-900">
        Want help applying? {tenant.shortName} can follow up with you.
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Share your contact info and a program manager will reach out {tenant.contactPromise}.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="intake-name" className="block text-sm font-medium text-gray-700">
            First name
          </label>
          <input
            id="intake-name"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="intake-phone" className="block text-sm font-medium text-gray-700">
            Phone number
          </label>
          <input
            id="intake-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="intake-email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="intake-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Best way to reach you?</legend>
          <div className="mt-2 flex gap-3">
            {(["phone", "text", "email"] as const).map((method) => (
              <label
                key={method}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  contactMethod === method
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="contact_method"
                  value={method}
                  checked={contactMethod === method}
                  onChange={() => setContactMethod(method)}
                  className="sr-only"
                />
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary"
          />
          <span className="text-sm text-gray-600">
            I agree to share my contact info with {tenant.name} so they can help me apply for programs.
            My screening answers will also be shared.
          </span>
        </label>

        {state === "error" && (
          <p className="text-sm text-red-600">
            Something went wrong. You can also reach {tenant.shortName} directly by phone.
          </p>
        )}

        <button
          type="submit"
          disabled={!consent || !firstName.trim() || !phone.trim() || state === "submitting"}
          className={`w-full rounded-lg px-6 py-3 text-sm font-semibold focus:ring-2 focus:outline-none ${
            !consent || !firstName.trim() || !phone.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : state === "submitting"
              ? "bg-primary/70 text-white cursor-wait"
              : "bg-primary text-white hover:bg-primary-dark focus:ring-primary-light"
          }`}
        >
          {state === "submitting" ? "Sending..." : "Send My Info"}
        </button>
      </form>
    </div>
  );
}
