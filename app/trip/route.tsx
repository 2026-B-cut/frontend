import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { GuardedPressable as Pressable } from '@/components/guarded-pressable';
import { LocalizedText as Text } from '@/components/localized-text';
import { ActiveRouteRecommendation, type ActiveRouteMissionGroup } from '@/features/trip/active/components/active-route-recommendation';
import { getScheduleDateOptions, hasSavedRouteRecommendation, saveRouteRecommendationSignature, sortMissionsByVisitOrder } from '@/features/trip/active/active-data';
import { getParamValue } from '@/features/trip/trip-data';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getAuthItem } from '@/lib/auth-storage';
import { getTripSchedule, recommendMissionOrder, TripScheduleApiError, type TripSchedule } from '@/lib/trip-schedule-api';
import { styles } from '@/features/trip/active/route-screen-styles';

function getRouteErrorMessage(error: unknown) {
  const code = error instanceof TripScheduleApiError ? error.code : undefined;

  if (code === 'MISSION_DATE_OUT_OF_RANGE') {
    return '일정 기간 밖의 날짜입니다.';
  }

  if (code === 'SCHEDULE_MISSIONS_CHANGED') {
    return '일정 미션이 변경됐어요. 최신 일정으로 다시 시도해 주세요.';
  }

  if (code === 'NO_MISSIONS_FOR_DATE') {
    return '해당 날짜에 미션이 없습니다.';
  }

  if (code === 'ROUTE_RECOMMENDATION_UNAVAILABLE' || code === 'OPENAI_NOT_CONFIGURED') {
    return '동선 추천에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return error instanceof Error ? error.message : '동선 추천에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

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
  const { bottomSafeInset, horizontalPadding, topSafeInset } = useResponsiveLayout();
  const [schedule, setSchedule] = useState<TripSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [recommendingDate, setRecommendingDate] = useState<string | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState('');
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
      setRecommendationMessage('');
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
      setRecommendationMessage(`${result.plannedDate} 경로를 추천했어요.`);
    } catch (error) {
      setRecommendationMessage(getRouteErrorMessage(error));
    } finally {
      setRecommendingDate(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSafeInset + 32, paddingHorizontal: horizontalPadding, paddingTop: topSafeInset + 12 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="뒤로 가기" onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons color="#10161F" name="chevron-back" size={30} />
          </Pressable>
          <Text style={styles.headerTitle}>날짜별 경로</Text>
          <View style={styles.headerSpacer} />
        </View>
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
            {recommendationMessage ? <Text style={styles.resultMessage}>{recommendationMessage}</Text> : null}
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
