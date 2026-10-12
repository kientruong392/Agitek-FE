export const VIETNAM_BOUNDS = {
  minLat: 8.15,
  maxLat: 23.45,
  minLng: 102.10,
  maxLng: 112.00,
  defaultCenter: [21.028511, 105.854167] as [number, number], // Hà Nội
  defaultZoom: 13,
};

export function isWithinVietnam(lat: number, lng: number): boolean {
  if (isNaN(lat) || isNaN(lng)) return false;
  return (
    lat >= VIETNAM_BOUNDS.minLat &&
    lat <= VIETNAM_BOUNDS.maxLat &&
    lng >= VIETNAM_BOUNDS.minLng &&
    lng <= VIETNAM_BOUNDS.maxLng
  );
}

// 2 uppercase letters followed by 2 digits: HN01, SG02, LX03,...
export const LOCATION_CODE_REGEX = /^[A-Z]{2}[0-9]{2}$/;

export function isValidLocationCode(code: string): boolean {
  return LOCATION_CODE_REGEX.test(code.trim());
}
