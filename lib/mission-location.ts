export type MissionLocation = {
  id: number | string;
  label: string | null;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  locationType: 'MISSION' | 'DEVELOPER';
};

export function normalizeMissionLocations(mission: unknown): MissionLocation[] {
  if (!mission || typeof mission !== 'object') {
    return [];
  }

  const rawLocations = (mission as { locations?: unknown }).locations;
  if (!Array.isArray(rawLocations)) {
    return [];
  }

  return rawLocations
    .map((location, index) => normalizeMissionLocation(location, index))
    .filter((location): location is MissionLocation => Boolean(location));
}

export function requiresMissionLocation(verificationType: string | null | undefined) {
  return verificationType?.toUpperCase() === 'GPS_PHOTO';
}

export async function ensureMissionLocation(
  verificationType: string | null | undefined,
  locations: MissionLocation[] | null | undefined,
) {
  if (!requiresMissionLocation(verificationType)) {
    return;
  }

  if (!locations?.length) {
    throw new Error('미션 장소 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }

  if (!(await isWithinMissionLocations(locations))) {
    throw new Error('미션 장소 근처에서만 미션을 시작할 수 있어요.');
  }
}

type DeviceLocation = {
  latitude: number;
  longitude: number;
};

export async function getCurrentDeviceLocation(): Promise<DeviceLocation> {
  let Location: typeof import('expo-location');
  try {
    Location = await import('expo-location');
  } catch {
    throw new Error('위치 기능을 사용할 수 없어요. 앱을 최신 개발 빌드로 다시 설치해 주세요.');
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('미션 촬영을 위해 위치 권한이 필요해요.');
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('위치 서비스를 켜고 다시 시도해 주세요.');
  }

  let location: import('expo-location').LocationObject;
  try {
    location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch {
    throw new Error('현재 위치를 가져오지 못했어요. 위치 서비스를 켜고 다시 시도해 주세요.');
  }

  const { latitude, longitude } = location.coords;
  if (
    !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
  ) {
    throw new Error('현재 위치를 확인하지 못했어요. 다시 시도해 주세요.');
  }

  return { latitude, longitude };
}

export function calculateDistanceMeters(
  from: DeviceLocation,
  to: Pick<MissionLocation, 'latitude' | 'longitude'>,
) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = degreesToRadians(to.latitude - from.latitude);
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const targetLatitude = degreesToRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(targetLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const clampedHaversine = Math.min(1, Math.max(0, haversine));

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(clampedHaversine), Math.sqrt(1 - clampedHaversine));
}

export async function isWithinMissionLocations(locations: MissionLocation[]) {
  const currentLocation = await getCurrentDeviceLocation();
  return locations.some((location) => (
    calculateDistanceMeters(currentLocation, location) <= location.allowedRadiusMeters
  ));
}

function normalizeMissionLocation(location: unknown, index: number): MissionLocation | null {
  if (!location || typeof location !== 'object') {
    return null;
  }

  const item = location as Record<string, unknown>;
  const latitude = normalizeFiniteNumber(item.latitude);
  const longitude = normalizeFiniteNumber(item.longitude);
  const allowedRadiusMeters = normalizeFiniteNumber(item.allowed_radius_m ?? item.allowedRadiusM ?? item.allowed_radius ?? item.allowedRadius ?? item.radius);

  if (
    latitude === null
    || longitude === null
    || allowedRadiusMeters === null
    || latitude < -90
    || latitude > 90
    || longitude < -180
    || longitude > 180
    || allowedRadiusMeters < 0
  ) {
    return null;
  }

  const locationType = String(item.location_type ?? item.locationType ?? 'MISSION').toUpperCase();
  if (locationType !== 'MISSION' && locationType !== 'DEVELOPER') {
    return null;
  }

  return {
    allowedRadiusMeters,
    id: typeof item.id === 'number' || typeof item.id === 'string' ? item.id : `${locationType}-${index}`,
    label: typeof item.label === 'string' ? item.label : null,
    latitude,
    locationType,
    longitude,
  };
}

function normalizeFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}
