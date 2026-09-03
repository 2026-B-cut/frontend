import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import type { TripScheduleMission } from '@/lib/trip-schedule-api';
import { getMissionDateLabel, getMissionLocation } from '../active-data';
import { styles } from './active-route-recommendation-styles';

export type ActiveRouteMissionGroup = {
  date: string;
  missions: TripScheduleMission[];
};

type ActiveRouteRecommendationProps = {
  canRecommendRoute: boolean;
  missionDateGroups: ActiveRouteMissionGroup[];
  onRecommendRoute: (plannedDate: string) => void;
  recommendedDates: string[];
  recommendingDate: string | null;
};

export function ActiveRouteRecommendation({
  canRecommendRoute,
  missionDateGroups,
  onRecommendRoute,
  recommendedDates,
  recommendingDate,
}: ActiveRouteRecommendationProps) {
  const groupsWithMissions = missionDateGroups.filter((group) => group.date !== 'UNPLANNED');
  const [expandedDate, setExpandedDate] = useState<string | null>(groupsWithMissions[0]?.date ?? null);

  useEffect(() => {
    setExpandedDate((currentDate) => currentDate && groupsWithMissions.some((group) => group.date === currentDate)
      ? currentDate
      : groupsWithMissions[0]?.date ?? null);
  }, [missionDateGroups]);

  if (groupsWithMissions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {groupsWithMissions.map((group) => {
        const isRecommending = recommendingDate === group.date;
        const isAlreadyRecommended = recommendedDates.includes(group.date);
        const isDisabled = Boolean(recommendingDate);
        const canRecommend = canRecommendRoute && group.missions.length >= 2;
        const isExpanded = group.date === expandedDate;

        return (
          <View key={group.date} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <ScalePressable accessibilityRole="button" accessibilityLabel={`${group.date} ${isExpanded ? '접기' : '펼치기'}`} onPress={() => setExpandedDate((currentDate) => currentDate === group.date ? null : group.date)} pressedScale={0.99} style={styles.dayToggle}>
                <Ionicons color="#56869D" name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={24} />
                <Text style={styles.dayTitle}>{`${groupsWithMissions.indexOf(group) + 1}일차`}</Text>
                <Text style={styles.dayDate}>{getMissionDateLabel(group.date)}</Text>
              </ScalePressable>
              {canRecommend && isExpanded ? (
                <ScalePressable
                  accessibilityRole="button"
                  accessibilityLabel={`${getMissionDateLabel(group.date)} 순서 수정`}
                  disabled={isDisabled || isAlreadyRecommended}
                  onPress={() => onRecommendRoute(group.date)}
                  pressedScale={0.96}
                  style={[styles.routeButton, (isDisabled || isAlreadyRecommended) && !isRecommending && styles.disabledButton]}>
                  {isRecommending ? <ActivityIndicator color="#56869D" size="small" /> : null}
                  <Text style={styles.routeButtonText}>{isRecommending ? '추천 중' : '순서 수정'}</Text>
                </ScalePressable>
              ) : null}
            </View>
            {isExpanded && group.missions.length > 0 ? (
              <View style={styles.missionList}>
                {group.missions.map((mission) => (
                  <View key={mission.scheduleMissionId} style={styles.missionRow}>
                    <View style={styles.missionCopy}>
                      <Text numberOfLines={1} style={styles.missionTitle}>{mission.title}</Text>
                      <Text numberOfLines={1} style={styles.missionLocation}>{getMissionLocation(mission)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
