// 관광지 상세 정보와 백엔드가 추천한 미션을 표시합니다.
import { LocalizedText as Text } from '@/components/localized-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  getTourismPlaceDetail,
  normalizeTourismImageUrl,
  TourismSearchApiError,
  type TourismMissionRecommendation,
  type TourismPetInformation,
  type TourismPlaceDetail,
} from '@/lib/tourism-api';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { styles } from './styles';

function getImageUrl(imageUrl: string | null | undefined) {
  return normalizeTourismImageUrl(imageUrl);
}

function formatDistance(distanceMeters: number | null | undefined) {
  if (distanceMeters === null || distanceMeters === undefined) {
    return null;
  }

  return distanceMeters < 1000 ? `${distanceMeters}m` : `${(distanceMeters / 1000).toFixed(1)}km`;
}

function getPetRows(pet: TourismPetInformation) {
  return [
    ['동반 유형', pet.accompaniment_type],
    ['동반 가능 대상', pet.allowed_companions],
    ['필수 준비물', pet.required_items],
    ['주의사항', pet.precautions],
    ['사고 위험 안내', pet.accident_risk_notes],
    ['관련 시설', pet.related_facilities],
    ['제공 물품', pet.provided_items],
    ['구매 가능 물품', pet.purchasable_items],
    ['대여 물품', pet.rental_items],
  ].filter((row): row is [string, string] => Boolean(row[1]?.trim()));
}

function MissionRecommendationCard({ mission }: { mission: TourismMissionRecommendation }) {
  const imageUrl = getImageUrl(mission.target_photo_url);
  const distance = formatDistance(mission.distance_m);

  return (
    <View style={styles.missionRecommendationCard}>
      <View style={styles.missionRecommendationHeader}>
        <View style={styles.missionRecommendationHeading}>
          <Text style={styles.missionRecommendationTitle}>{mission.title}</Text>
          {mission.place_label ? <Text style={styles.missionRecommendationPlace}>{mission.place_label}</Text> : null}
          {distance ? <Text style={styles.missionRecommendationDistance}>{distance}</Text> : null}
        </View>
        {imageUrl ? <Image contentFit="cover" source={{ uri: imageUrl }} style={styles.missionRecommendationImage} /> : <View style={styles.missionRecommendationImagePlaceholder} />}
      </View>

      <Text style={styles.missionRecommendationDescription}>{mission.description}</Text>

      {mission.match_reasons.length > 0 ? (
        <View style={styles.matchReasons}>
          {mission.match_reasons.map((reason) => (
            <View key={reason} style={styles.matchReason}>
              <Text style={styles.matchReasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PlaceDetailContent({ detail }: { detail: TourismPlaceDetail }) {
  const imageUrl = getImageUrl(detail.image_url || detail.thumbnail_url);
  const petRows = detail.pet ? getPetRows(detail.pet) : [];

  return (
    <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
      {imageUrl ? <Image contentFit="cover" source={{ uri: imageUrl }} style={styles.detailImage} /> : <View style={styles.detailImagePlaceholder} />}

      <Text style={styles.detailTitle}>{detail.title}</Text>
      {detail.address ? <Text style={styles.detailAddress}>{detail.address}</Text> : null}
      {detail.detail_address ? <Text style={styles.detailAddress}>{detail.detail_address}</Text> : null}
      {detail.phone ? <Text style={styles.detailPhone}>{detail.phone}</Text> : null}

      <Text style={styles.detailSectionTitle}>관광지 소개</Text>
      <Text style={styles.detailOverview}>{detail.overview || '이 관광지에 대한 상세 설명이 아직 준비되지 않았어요.'}</Text>

      {detail.pet ? (
        <View>
          <Text style={styles.detailSectionTitle}>반려동물 정보</Text>
          {petRows.length > 0 ? (
            <View style={styles.petInfoCard}>
              {petRows.map(([label, value]) => (
                <View key={label} style={styles.petInfoRow}>
                  <Text style={styles.petInfoLabel}>{label}</Text>
                  <Text style={styles.petInfoValue}>{value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.detailOverview}>반려동물 관련 정보가 아직 준비되지 않았어요.</Text>
          )}
        </View>
      ) : null}

      {detail.recommended_missions.length > 0 ? (
        <View>
          <Text style={styles.detailSectionTitle}>이 장소와 어울리는 미션</Text>
          <View style={styles.missionRecommendationList}>
            {detail.recommended_missions.map((mission) => (
              <MissionRecommendationCard key={mission.mission_id} mission={mission} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

export default function TourismPlaceDetailScreen() {
  const { topSafeInset } = useResponsiveLayout();
  const { contentId: contentIdParam } = useLocalSearchParams<{ contentId?: string | string[] }>();
  const contentId = Array.isArray(contentIdParam) ? contentIdParam[0] : contentIdParam;
  const [detail, setDetail] = useState<TourismPlaceDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) {
      setErrorMessage('관광지 정보를 찾을 수 없어요.');
      return;
    }

    const controller = new AbortController();
    setDetail(null);
    setErrorMessage(null);

    void getTourismPlaceDetail(contentId, controller.signal)
      .then(setDetail)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setErrorMessage(error instanceof TourismSearchApiError ? error.message : '관광지 정보를 불러오지 못했어요.');
      });

    return () => controller.abort();
  }, [contentId]);

  return (
    <View style={[styles.container, { paddingTop: topSafeInset + 20 }]}> 
      <View style={styles.detailHeader}>
        <Pressable accessibilityLabel="검색 결과로 돌아가기" hitSlop={10} onPress={() => router.back()} style={styles.detailBackButton}>
          <Feather color="#10161F" name="arrow-left" size={22} />
        </Pressable>
        <Text style={styles.detailHeaderTitle}>관광지 상세</Text>
        <View style={styles.detailHeaderSpacer} />
      </View>

      {detail ? (
        <PlaceDetailContent detail={detail} />
      ) : errorMessage ? (
        <View style={styles.detailMessageState}>
          <Text style={styles.searchMessage}>{errorMessage}</Text>
        </View>
      ) : (
        <View style={styles.detailLoadingState}>
          <ActivityIndicator color="#74B1C9" />
        </View>
      )}
    </View>
  );
}
