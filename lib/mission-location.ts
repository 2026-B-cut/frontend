export type MissionLocationTarget = {
  allowedRadius: number;
  targetLatitude: number;
  targetLongitude: number;
};

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
  to: Pick<MissionLocationTarget, 'targetLatitude' | 'targetLongitude'>,
) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = degreesToRadians(to.targetLatitude - from.latitude);
  const longitudeDelta = degreesToRadians(to.targetLongitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const targetLatitude = degreesToRadians(to.targetLatitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(targetLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const clampedHaversine = Math.min(1, Math.max(0, haversine));

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(clampedHaversine), Math.sqrt(1 - clampedHaversine));
}

export async function isWithinMissionRadius(target: MissionLocationTarget) {
  const currentLocation = await getCurrentDeviceLocation();
  return calculateDistanceMeters(currentLocation, target) <= target.allowedRadius;
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}
