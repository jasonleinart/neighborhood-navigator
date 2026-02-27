"use client";

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/dashboard/" },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-sm py-20">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Login</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your email to receive a magic link. No password needed.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">Check your email.</p>
            <p className="mt-1 text-sm text-green-700">
              We sent a login link to {email}. Click it to access the dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
                placeholder="you@your-cdc.org"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Send Magic Link
            </button>
          </form>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
