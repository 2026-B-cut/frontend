// main 홈의 사용자 정보와 완료된 매거진 목록을 불러옵니다.
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';

import { fetchMe } from '@/lib/auth-api';
import { getAuthItem } from '@/lib/auth-storage';
import { getMagazine, MagazineApiError, type Magazine } from '@/lib/magazine-api';
import { getLatestMissionSession, type MissionSession } from '@/lib/mission-session-api';
import { cancelMagazineNotification, scheduleMagazineNotification } from '@/lib/mission-notification';
import { getCachedTripSchedules, getTripSchedule, listTripSchedules, type TripSchedule } from '@/lib/trip-schedule-api';

import { getResultPhotoUrl, getScheduleEndTime, isClosedSchedule } from '../main-home-data';

export type MagazineHomeItem = {
  magazinePreviewUrl: string | null;
  photoUrls: string[];
  scheduleId: string;
};

type MagazineHomeCache = {
  magazines: MagazineHomeItem[];
  userId: string;
};

let magazineHomeCache: MagazineHomeCache | null = null;
const prefetchedMagazinePhotoUrls = new Set<string>();

function getCachedMagazineHome() {
  const userId = getAuthItem('user_id');

  if (!userId || magazineHomeCache?.userId !== userId) {
    return null;
  }

  return magazineHomeCache;
}

function cacheMagazineHome(magazines: MagazineHomeItem[]) {
  const userId = getAuthItem('user_id');

  if (!userId) {
    return;
  }

  magazineHomeCache = { magazines, userId };
}

function clearMagazineHomeCache() {
  magazineHomeCache = null;
}

function prefetchMagazinePhotos(photoUrls: string[]) {
  const urlsToPrefetch = photoUrls.filter((photoUrl) => {
    if (prefetchedMagazinePhotoUrls.has(photoUrl)) {
      return false;
    }

    prefetchedMagazinePhotoUrls.add(photoUrl);
    return true;
  });

  if (urlsToPrefetch.length === 0) {
    return;
  }

  void Image.prefetch(urlsToPrefetch, 'memory-disk').catch(() => {
    urlsToPrefetch.forEach((photoUrl) => prefetchedMagazinePhotoUrls.delete(photoUrl));
  });
}

export function useMainHome() {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileEmoji, setProfileEmoji] = useState<string | null>(null);
  const [magazines, setMagazines] = useState<MagazineHomeItem[]>([]);
  const [isMagazineLoading, setIsMagazineLoading] = useState(true);
  const [hasLoadedMagazine, setHasLoadedMagazine] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      fetchMe()
        .then((user) => {
          if (isActive) {
            setProfileImageUrl(user.profile_image_url);
            setProfileEmoji(user.profile_emoji);
          }
        })
        .catch(() => {
          if (isActive) {
            setProfileImageUrl(null);
            setProfileEmoji(null);
          }
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const cachedMagazine = getCachedMagazineHome();

      if (cachedMagazine) {
        setMagazines(cachedMagazine.magazines);
        setIsMagazineLoading(false);
        setHasLoadedMagazine(true);
      }

      const loadMagazines = async () => {
        if (isActive) {
          setIsMagazineLoading(true);
        }

        try {
          let schedules: TripSchedule[];

          try {
            schedules = await listTripSchedules();
          } catch {
            schedules = getCachedTripSchedules();
          }

          const magazinesByScheduleId = new Map<string, Magazine | null>();
          await Promise.all(schedules.map(async (schedule) => {
            if (!schedule.endDate) {
              return;
            }

            try {
              const magazine = await getMagazine(schedule.scheduleId);
              magazinesByScheduleId.set(schedule.scheduleId, magazine);
              await cancelMagazineNotification(schedule.scheduleId);
            } catch (error) {
              magazinesByScheduleId.set(schedule.scheduleId, null);
              if (error instanceof MagazineApiError && error.status === 404) {
                await scheduleMagazineNotification({
                  endDate: schedule.endDate,
                  scheduleId: schedule.scheduleId,
                  scheduleName: schedule.roomName,
                });
              }
            }
          }));

          const closedSchedules = schedules
            .filter(isClosedSchedule)
            .sort((left, right) => getScheduleEndTime(right) - getScheduleEndTime(left));

          if (closedSchedules.length === 0) {
            if (isActive) {
              clearMagazineHomeCache();
              setMagazines([]);
            }
            return;
          }

          const magazineItems = (await Promise.all(closedSchedules.map(async (schedule) => {
            let hydratedSchedule = schedule;

            // The list endpoint can omit missions after a fresh login. Hydrate
            // each selected schedule so its session photos can be assembled.
            if (hydratedSchedule.missions.length === 0) {
              try {
                hydratedSchedule = await getTripSchedule(hydratedSchedule.scheduleId);
              } catch {
                // The saved magazine lookup below can still recover a cover.
              }
            }

            const savedMagazinePreviewUrl = magazinesByScheduleId.get(schedule.scheduleId)?.imageUrls[0] ?? null;
            const photoUrls = (await Promise.all(hydratedSchedule.missions.map(async (mission) => {
              try {
                const session: MissionSession = await getLatestMissionSession(hydratedSchedule.scheduleId, mission.scheduleMissionId);
                return getResultPhotoUrl(session);
              } catch {
                return null;
              }
            }))).filter((photoUrl): photoUrl is string => Boolean(photoUrl)).slice(0, 3);

            if (photoUrls.length === 0 && !savedMagazinePreviewUrl) {
              return null;
            }

            return {
              magazinePreviewUrl: savedMagazinePreviewUrl,
              photoUrls,
              scheduleId: schedule.scheduleId,
            } satisfies MagazineHomeItem;
          }))).filter((magazine): magazine is MagazineHomeItem => Boolean(magazine));

          cacheMagazineHome(magazineItems);
          prefetchMagazinePhotos(magazineItems.flatMap((magazine) => magazine.photoUrls));

          if (isActive) {
            setMagazines(magazineItems);
          }
        } catch {
          if (isActive && !cachedMagazine) {
            clearMagazineHomeCache();
            setMagazines([]);
          }
        } finally {
          if (isActive) {
            setIsMagazineLoading(false);
            setHasLoadedMagazine(true);
          }
        }
      };

      void loadMagazines();

      return () => {
        isActive = false;
      };
    }, []),
  );

  return {
    hasLoadedMagazine,
    isMagazineLoading,
    magazines,
    profileEmoji,
    profileImageUrl,
  };
}
