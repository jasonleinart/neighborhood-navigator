import { Suspense } from "react";
import type { Metadata } from "next";
import Screener from "@/components/Screener";
import { getValidCities, getCityData } from "@/lib/data";

export function generateStaticParams() {
  return getValidCities().map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityData = getCityData(city);
  const cityName = cityData?.meta.name || city;

  return {
    title: `${cityName} Programs`,
    description: `Find assistance programs you qualify for in ${cityName} — property tax relief, home repair, utility help, and more.`,
    openGraph: {
      title: `${cityName} Programs | Neighborhood Navigator`,
      description: `Find assistance programs you qualify for in ${cityName}.`,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;

  return (
    <Suspense>
      <Screener citySlug={city} />
    </Suspense>
  );
}
