export interface AddressSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface NominatimSearchItem {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverseItem {
  display_name?: string;
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const toNumber = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const searchAddress = async (
  keyword: string,
  limit: number = 6,
): Promise<AddressSuggestion[]> => {
  const query = keyword.trim();
  if (query.length < 3) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "vn",
      limit: String(limit),
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        "Accept-Language": "vi",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as NominatimSearchItem[];
    return data
      .map((item) => {
        const latitude = toNumber(item.lat);
        const longitude = toNumber(item.lon);
        if (latitude === null || longitude === null) return null;

        return {
          displayName: item.display_name,
          latitude,
          longitude,
        } as AddressSuggestion;
      })
      .filter((item): item is AddressSuggestion => item !== null);
  } catch {
    return [];
  }
};

const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<string | null> => {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "jsonv2",
      addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        "Accept-Language": "vi",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimReverseItem;
    return data.display_name ?? null;
  } catch {
    return null;
  }
};

export const geocodingService = {
  searchAddress,
  reverseGeocode,
};

