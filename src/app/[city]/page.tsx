import { Suspense } from "react";
import Screener from "@/components/Screener";
import { getValidCities } from "@/lib/data";

export function generateStaticParams() {
  return getValidCities().map((city) => ({ city }));
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
