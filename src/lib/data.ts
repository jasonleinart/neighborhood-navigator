import type { Program, CityMeta } from "./types";
import type { HopeData } from "./hope-types";

import detroitPrograms from "@/data/detroit/programs.json";
import detroitMeta from "@/data/detroit/meta.json";
import detroitHope from "@/data/detroit/hope.json";

interface CityData {
  programs: Program[];
  meta: CityMeta;
  hope?: HopeData;
}

const cities: Record<string, CityData> = {
  detroit: {
    programs: detroitPrograms as Program[],
    meta: detroitMeta as CityMeta,
    hope: detroitHope as unknown as HopeData,
  },
};

export function getCityData(citySlug: string): CityData | null {
  return cities[citySlug] ?? null;
}

export function getValidCities(): string[] {
  return Object.keys(cities);
}

export function getHopeData(citySlug: string): HopeData | null {
  return cities[citySlug]?.hope ?? null;
}

/**
 * Find which city a ZIP code belongs to.
 * Returns the city slug or null if not found.
 */
export function findCityByZip(zip: string): string | null {
  for (const [slug, data] of Object.entries(cities)) {
    if (data.meta.valid_zips.includes(zip)) {
      return slug;
    }
  }
  return null;
}
