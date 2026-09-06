// 지도 asset, 구역 터치 영역과 관련 상수 데이터입니다.
import type { CategoryItem, MapPieceTarget, MissionTheme } from './types';

export const dividedMap = require('@/assets/svg/map/demo_map.svg');

export const themeMapByCategory: Record<MissionTheme, number> = {
  MOUNTAIN: require('@/assets/svg/map/mountain_map.svg'),
  SEA: require('@/assets/svg/map/sea_map.svg'),
  CITY: require('@/assets/svg/map/city_map.svg'),
};

export const categoryItems: CategoryItem[] = [
  {
    icon: require('@/assets/svg/theme_icon/mountain.svg'),
    selectedIcon: require('@/assets/svg/theme_icon/mountain_filled.svg'),
    label: '산',
    value: 'MOUNTAIN',
  },
  {
    icon: require('@/assets/svg/theme_icon/sea.svg'),
    selectedIcon: require('@/assets/svg/theme_icon/sea_filled.svg'),
    label: '바다',
    value: 'SEA',
  },
  {
    icon: require('@/assets/svg/theme_icon/city.svg'),
    selectedIcon: require('@/assets/svg/theme_icon/city_filled.svg'),
    label: '도시',
    value: 'CITY',
  },
];

export const mapPieceTargets: MapPieceTarget[] = [
  { number: 1, district: '강서구', districtCode: 'GANGSEO', x: 0.18, y: 0.64 },
  { number: 2, district: '사하구', districtCode: 'SAHA', x: 0.38, y: 0.74 },
  { number: 3, district: '사상구', districtCode: 'SASANG', x: 0.4, y: 0.54 },
  { number: 4, district: '북구', districtCode: 'BUK', x: 0.45, y: 0.37 },
  { number: 5, district: '금정구', districtCode: 'GEUMJEONG', x: 0.56, y: 0.33 },
  { number: 6, district: '동래구', districtCode: 'DONGNAE', x: 0.565, y: 0.44 },
  { number: 7, district: '연제구', districtCode: 'YEONJE', x: 0.586, y: 0.505 },
  { number: 8, district: '부산진구', districtCode: 'BUSANJIN', x: 0.486, y: 0.54 },
  { number: 9, district: '서구', districtCode: 'SEO', x: 0.45, y: 0.637 },
  { number: 10, district: '동구', districtCode: 'DONG', x: 0.528, y: 0.594 },
  { number: 11, district: '중구', districtCode: 'JUNG', x: 0.526, y: 0.674 },
  { number: 12, district: '수영구', districtCode: 'SUYEONG', x: 0.642, y: 0.543 },
  { number: 13, district: '남구', districtCode: 'NAM', x: 0.602, y: 0.657 },
  { number: 14, district: '영도구', districtCode: 'YEONGDO', x: 0.562, y: 0.747 },
  { number: 15, district: '해운대구', districtCode: 'HAEUNDAE', x: 0.735, y: 0.467 },
  { number: 16, district: '기장군', districtCode: 'GIJANG', x: 0.815, y: 0.247 },
];

const baseDistrictTouchPolygons: Record<number, string> = {
  1: '0.02,0.36 0.30,0.50 0.28,0.86 0.04,0.86 0.02,0.68',
  2: '0.17,0.56 0.44,0.69 0.44,0.83 0.26,0.88 0.20,0.76',
  3: '0.28,0.45 0.43,0.43 0.42,0.60 0.31,0.63 0.24,0.55',
  4: '0.36,0.23 0.51,0.18 0.51,0.38 0.43,0.44 0.33,0.36',
  5: '0.50,0.17 0.67,0.16 0.69,0.34 0.60,0.39 0.49,0.35',
  6: '0.52,0.38 0.62,0.38 0.64,0.46 0.54,0.47 0.49,0.43',
  7: '0.54,0.46 0.63,0.46 0.63,0.53 0.54,0.54',
  8: '0.42,0.48 0.54,0.47 0.54,0.58 0.43,0.60 0.38,0.54',
  9: '0.38,0.60 0.48,0.58 0.49,0.69 0.40,0.72 0.34,0.66',
  10: '0.50,0.55 0.58,0.55 0.58,0.64 0.48,0.64 0.46,0.59',
  11: '0.48,0.64 0.56,0.64 0.56,0.71 0.48,0.71',
  12: '0.59,0.49 0.70,0.49 0.70,0.60 0.62,0.60 0.57,0.54',
  13: '0.54,0.59 0.68,0.59 0.70,0.76 0.58,0.74 0.50,0.66',
  14: '0.48,0.72 0.64,0.72 0.68,0.88 0.47,0.88 0.43,0.78',
  15: '0.65,0.39 0.88,0.36 0.90,0.55 0.70,0.58 0.62,0.50',
  16: '0.68,0.02 0.98,0.02 0.96,0.37 0.80,0.42 0.67,0.31',
};

type DistrictTouchAdjustment = {
  moveX?: number;
  moveY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
};

// 이동값은 각 구역의 기존 bounds 크기를 기준으로 한 비율입니다.
const districtTouchAdjustments: Record<number, DistrictTouchAdjustment> = {
  2: { moveX: 0.25, moveY: -0.15, scale: 1 / 2 }, // 사하구: 기존 크기의 1.5배, 조금 아래
  4: { moveX: 0.15, moveY: 0.15, scale: 1 / 2 }, // 북구: 좌측으로 조금, 살짝 위
  5: { moveX: -0.1, scale: 3 / 4 }, // 금정구: 3/4, 좌측으로 조금
  6: { moveX: -0.15, moveY: -0.15, scale: 3 / 4 }, // 동래구: 3/4, 약간 좌측 위
  7: { moveX: -0.1, moveY: -0.2, scale: 0.8 }, // 연제구: 0.8배, 우측 위
  8: { moveX: 0.25, moveY: -0.25, scale: 1 / 2 }, // 부산진구: 1/2, 우측 위
  9: { moveX: 0.15, moveY: -0.5, scale: 0.26 }, // 서구: 기존 크기의 1.3배, 살짝 좌측
  11: { moveX: -0.35, moveY: -0.45, scale: 0.8 }, // 중구: 0.8배, 살짝 위
  12: { moveY: -0.1, scale: 1 / 2 }, // 수영구: 1/2, 조금 위
  13: { moveY: -0.35, scaleX: 0.4, scaleY: 0.7 }, // 남구: 세로가 더 긴 사각형, 살짝 위
  14: { moveX: 0.05, moveY: -0.75, scale: 1 / 4 }, // 영도구: 1/4, 우측 위로 조금
  15: { moveX: -0.25, moveY: -0.15, scaleX: 1 / 3, scaleY: 1 / 2 }, // 해운대구: 세로가 더 긴 1/3 크기, 우측으로 조금
  16: { moveX: -0.15, scale: 3 / 4 }, // 기장군: 3/4, 살짝 좌측
};

function adjustDistrictTouchPolygon(points: string, adjustment: DistrictTouchAdjustment) {
  const coordinates = points.split(' ').map((point) => {
    const [x, y] = point.split(',').map(Number);

    return { x, y };
  });
  const xValues = coordinates.map((coordinate) => coordinate.x);
  const yValues = coordinates.map((coordinate) => coordinate.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const width = maxX - minX;
  const height = maxY - minY;
  const scaleX = adjustment.scaleX ?? adjustment.scale ?? 1;
  const scaleY = adjustment.scaleY ?? adjustment.scale ?? 1;

  return coordinates
    .map((coordinate) => {
      const x = centerX + (coordinate.x - centerX) * scaleX + width * (adjustment.moveX ?? 0);
      const y = centerY + (coordinate.y - centerY) * scaleY + height * (adjustment.moveY ?? 0);

      return `${x.toFixed(4)},${y.toFixed(4)}`;
    })
    .join(' ');
}

export const districtTouchPolygons: Record<number, string> = Object.fromEntries(
  Object.entries(baseDistrictTouchPolygons).map(([number, points]) => {
    const adjustment = districtTouchAdjustments[Number(number)];

    return [number, adjustment ? adjustDistrictTouchPolygon(points, adjustment) : points];
  }),
) as Record<number, string>;

export const DEFAULT_THEME_DISTRICTS: Record<MissionTheme, string[]> = {
  MOUNTAIN: ['DONGNAE', 'SAHA', 'BUK', 'GEUMJEONG', 'BUSANJIN', 'NAM'],
  SEA: ['GIJANG', 'HAEUNDAE', 'SUYEONG', 'YEONGDO', 'SEO', 'SAHA', 'JUNG'],
  CITY: ['GANGSEO', 'BUK', 'DONGNAE', 'YEONJE', 'NAM', 'JUNG', 'BUSANJIN', 'SAHA'],
};

export const MAP_ASPECT_RATIO = 1;
export const MISSION_FRAME_ASPECT_RATIO = 164 / 209;

export function getPolygonBounds(points: string) {
  const coordinates = points.split(' ').map((point) => {
    const [x, y] = point.split(',').map(Number);

    return { x, y };
  });
  const xValues = coordinates.map((coordinate) => coordinate.x);
  const yValues = coordinates.map((coordinate) => coordinate.y);

  return {
    maxX: Math.max(...xValues),
    maxY: Math.max(...yValues),
    minX: Math.min(...xValues),
    minY: Math.min(...yValues),
  };
}
