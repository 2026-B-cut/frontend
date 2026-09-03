import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { LocalizedText as Text } from '@/components/localized-text';
import { TopBar } from '@/components/top-bar';
import { ActiveRouteRecommendation, type ActiveRouteMissionGroup } from '@/features/trip/active/components/active-route-recommendation';
import { getScheduleDateOptions, hasSavedRouteRecommendation, saveRouteRecommendationSignature, sortMissionsByVisitOrder } from '@/features/trip/active/active-data';
import { getParamValue } from '@/features/trip/trip-data';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getAuthItem } from '@/lib/auth-storage';
import { getTripSchedule, recommendMissionOrder, type TripSchedule } from '@/lib/trip-schedule-api';
import { styles } from '@/features/trip/active/route-screen-styles';

function getMissionDateGroups(schedule: TripSchedule | null): ActiveRouteMissionGroup[] {
  if (!schedule) {
    return [];
  }

  const dateOptions = getScheduleDateOptions(schedule);
  const groups = dateOptions.map((date) => ({
    date,
    missions: sortMissionsByVisitOrder(schedule.missions.filter((mission) => mission.plannedDate === date)),
  }));
  const unplannedMissions = schedule.missions.filter((mission) => !mission.plannedDate || !dateOptions.includes(mission.plannedDate));

  if (unplannedMissions.length > 0) {
    groups.push({ date: 'UNPLANNED', missions: sortMissionsByVisitOrder(unplannedMissions) });
  }

  return groups;
}

export default function RouteRecommendationScreen() {
  const params = useLocalSearchParams<{ scheduleId?: string | string[] }>();
  const scheduleId = getParamValue(params.scheduleId);
  const currentUserId = getAuthItem('user_id');
  const { bottomSafeInset, horizontalPadding, topInset } = useResponsiveLayout();
  const [schedule, setSchedule] = useState<TripSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [recommendingDate, setRecommendingDate] = useState<string | null>(null);
  const [recommendedDates, setRecommendedDates] = useState<string[]>([]);
  const missionDateGroups = useMemo(() => getMissionDateGroups(schedule), [schedule]);
  const isScheduleCreator = Boolean(schedule?.creatorId && currentUserId && schedule.creatorId === currentUserId);

  useEffect(() => {
    let isActive = true;

    if (!scheduleId) {
      setMessage('일정 정보가 없습니다.');
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    getTripSchedule(scheduleId)
      .then((nextSchedule) => {
        if (isActive) {
          setSchedule(nextSchedule);
          setMessage('');
          setRecommendedDates(getScheduleDateOptions(nextSchedule).filter((date) => (
            hasSavedRouteRecommendation(
              nextSchedule.scheduleId,
              date,
              nextSchedule.missions.filter((mission) => mission.plannedDate === date),
            )
          )));
        }
      })
      .catch((error) => {
        if (isActive) {
          setMessage(error instanceof Error ? error.message : '일정을 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [scheduleId]);

  const handleRecommendRoute = async (plannedDate: string) => {
    if (!schedule || !isScheduleCreator || recommendingDate) {
      return;
    }

    try {
      setRecommendingDate(plannedDate);
      const result = await recommendMissionOrder(schedule.scheduleId, plannedDate);
      saveRouteRecommendationSignature(schedule.scheduleId, result.plannedDate, result.missions);
      setRecommendedDates((currentDates) => currentDates.includes(result.plannedDate) ? currentDates : [...currentDates, result.plannedDate]);

      setSchedule((currentSchedule) => currentSchedule ? {
        ...currentSchedule,
        missions: [
          ...currentSchedule.missions.filter((mission) => mission.plannedDate !== result.plannedDate),
          ...result.missions,
        ],
      } : currentSchedule);
    } catch {
      // 경로 추천 실패 시 별도 결과 메시지를 표시하지 않습니다.
    } finally {
      setRecommendingDate(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSafeInset + 32, paddingHorizontal: horizontalPadding, paddingTop: topInset }]}
        showsVerticalScrollIndicator={false}>
        <TopBar title="날짜별 경로" />
        <View style={styles.intro}>
          <Text numberOfLines={1} style={styles.tripName}>{schedule?.roomName ?? '우정여행🐷🐷'}</Text>
          <Text style={styles.introDescription}>미션 순서를 추천받아 보세요</Text>
        </View>
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#409CB7" />
            <Text style={styles.stateText}>일정을 불러오는 중이에요.</Text>
          </View>
        ) : message ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{message}</Text>
          </View>
        ) : schedule ? (
          <>
            {!isScheduleCreator ? <Text style={styles.permissionHint}>일정 생성자만 경로를 추천할 수 있어요.</Text> : null}
            <ActiveRouteRecommendation
              canRecommendRoute={isScheduleCreator}
              missionDateGroups={missionDateGroups}
              onRecommendRoute={(plannedDate) => void handleRecommendRoute(plannedDate)}
              recommendedDates={recommendedDates}
              recommendingDate={recommendingDate}
            />
            {missionDateGroups.every((group) => group.missions.length === 0) ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateText}>아직 담긴 미션이 없어요.</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
