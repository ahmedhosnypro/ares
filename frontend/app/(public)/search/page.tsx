import SearchPageContent from "./SearchPageContent";
import {
  fetchFeaturedVehicles,
  fetchPublicLocations,
  formatDateInputValue,
  type PublicLocation,
} from "@/utils/public-data";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getDefaultDates() {
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 1);

  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 4);

  return {
    pickupDate: formatDateInputValue(pickupDate),
    returnDate: formatDateInputValue(returnDate),
  };
}

function findLocationById(locations: PublicLocation[], locationId: string): PublicLocation | undefined {
  return locations.find(location => location.id === locationId);
}

export default async function SearchPage({ searchParams }: Readonly<PageProps>) {
  const resolvedSearchParams = await searchParams;
  const defaultDates = getDefaultDates();
  const locations = await fetchPublicLocations();

  const pickupLocationId = firstValue(resolvedSearchParams.pickupLocationId) || locations[0]?.id || "";
  const pickupDate = firstValue(resolvedSearchParams.pickupDate) || defaultDates.pickupDate;
  const returnDate = firstValue(resolvedSearchParams.returnDate) || defaultDates.returnDate;

  const selectedLocation = findLocationById(locations, pickupLocationId) ?? locations[0];
  const vehicles = pickupLocationId ? await fetchFeaturedVehicles(pickupLocationId, pickupDate, returnDate, 12) : [];

  return (
    <SearchPageContent
      locations={locations}
      vehicles={vehicles}
      pickupLocationId={pickupLocationId}
      pickupDate={pickupDate}
      returnDate={returnDate}
      selectedLocation={selectedLocation}
    />
  );
}
