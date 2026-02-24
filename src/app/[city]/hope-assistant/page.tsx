import { Suspense } from "react";
import HopeAssistant from "@/components/HopeAssistant";
import { getValidCities, getHopeData } from "@/lib/data";

export function generateStaticParams() {
  return getValidCities().map((city) => ({ city }));
}

export default async function HopeAssistantPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const hopeData = getHopeData(city);

  if (!hopeData) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted">
          The HOPE Tax Exemption Assistant is not available for this city.
        </p>
        <a href={`/${city}`} className="mt-4 inline-block text-primary underline">
          Back to screener
        </a>
      </div>
    );
  }

  return (
    <Suspense>
      <HopeAssistant hopeData={hopeData} citySlug={city} />
    </Suspense>
  );
}
