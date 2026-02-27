/**
 * Privacy-respecting analytics via Plausible.
 * No-ops gracefully if Plausible is not loaded.
 */

type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void;
  }
}

export function trackEvent(name: string, props?: EventProps): void {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(name, props ? { props } : undefined);
  }
}
