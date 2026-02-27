import type { TenantConfig } from "@/lib/types";

const tenantCache = new Map<string, TenantConfig>();

export function getTenantConfig(slug: string): TenantConfig | null {
  if (tenantCache.has(slug)) return tenantCache.get(slug)!;

  try {
    // Dynamic import from tenants directory
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(`@/data/tenants/${slug}.json`) as TenantConfig;
    tenantCache.set(slug, config);
    return config;
  } catch {
    return null;
  }
}
