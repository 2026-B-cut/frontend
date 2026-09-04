// 검색 결과에서 선택한 관광지 상세 화면입니다.
import { LocalizedText as Text } from '@/components/localized-text';
import { MissionCard } from '@/components/mission-card';
import { TopBar } from '@/components/top-bar';
import { MISSION_FRAME_ASPECT_RATIO } from '@/features/map/map-data';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { fetchMissions, type MissionItem } from '@/lib/mission-api';
import {
  getTourismPlaceDetail,
  normalizeTourismImageUrl,
  searchTourismEvents,
  TourismSearchApiError,
  type TourismMissionRecommendation,
  type TourismPlaceDetail,
  type TourismPlaceSearchItem,
} from '@/lib/tourism-api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import { styles } from './styles';

function getImageUrl(imageUrl: string | null | undefined) {
  return normalizeTourismImageUrl(imageUrl);
}

function getLocation(place: { address?: string | null; detail_address?: string | null }) {
  return place.address || place.detail_address || '부산';
}

function getPlaceDistrict(address: string | null | undefined) {
  const parts = address?.split(' ').filter(Boolean) ?? [];
  return parts.slice(0, 2).join(' ') || '부산';
}

function EventInfoRow({
  icon,
  children,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  children: string;
}) {
  return (
    <View style={styles.eventInfoRow}>
      <MaterialCommunityIcons color="#B7C0C4" name={icon} size={19} />
      <Text style={styles.eventInfoText}>{children}</Text>
    </View>
  );
}

function TourismEventCard({ event }: { event: TourismPlaceSearchItem }) {
  const imageUrl = getImageUrl(event.image_url || event.thumbnail_url);

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardHeader}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {imageUrl ? <Image contentFit="cover" source={{ uri: imageUrl }} style={styles.eventImage} /> : null}
      </View>
      <EventInfoRow icon="map-marker-outline">{getLocation(event)}</EventInfoRow>
      {event.phone ? <EventInfoRow icon="phone-outline">{event.phone}</EventInfoRow> : null}
      {event.detail_address ? <Text style={styles.eventDescription}>{event.detail_address}</Text> : null}
    </View>
  );
}

function MissionRecommendationCard({
  isLast,
  mission,
  onPress,
}: {
  isLast: boolean;
  mission: MissionItem | TourismMissionRecommendation;
  onPress: (mission: MissionItem | TourismMissionRecommendation) => void;
}) {
  const isRecommendation = 'mission_id' in mission;
  const { width } = useResponsiveLayout();
  const cardWidth = Math.min(width * 0.84, 344);
  const cardHeight = cardWidth / MISSION_FRAME_ASPECT_RATIO;
  const cardVisualGap = 8 - cardWidth * (42 / 164);
  const missionData = isRecommendation ? {
    description: mission.description,
    iconUrl: null,
    title: mission.title,
    type: mission.type,
  } : {
    description: mission.description,
    iconText: mission.rewardItemIcon,
    iconUrl: mission.emojiUrl,
    title: mission.title,
    type: mission.type,
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(mission)}
      style={[styles.mapMissionCard, { height: cardHeight, marginRight: isLast ? 0 : cardVisualGap, width: cardWidth }]}
    >
      <MissionCard mission={missionData} />
    </Pressable>
  );
}

function PlaceDetailPager({
  detail,
  events,
  eventsError,
  eventsLoading,
  availableMissions,
  onMissionPress,
  onSectionChange,
  scrollRef,
  setSectionHeight,
  snapOffsets,
}: {
  detail: TourismPlaceDetail;
  events: TourismPlaceSearchItem[];
  eventsError: string | null;
  eventsLoading: boolean;
  availableMissions: MissionItem[];
  onMissionPress: (mission: MissionItem | TourismMissionRecommendation) => void;
  onSectionChange: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollRef: React.RefObject<ScrollView | null>;
  setSectionHeight: (index: number, event: LayoutChangeEvent) => void;
  snapOffsets: number[];
}) {
  const imageUrl = getImageUrl(detail.image_url || detail.thumbnail_url);
  const tags = Array.from(new Set(detail.recommended_missions.flatMap((mission) => mission.match_reasons))).slice(0, 4);
  const districtCode = detail.district_code?.trim().toUpperCase();
  const placeMissions = districtCode
    ? availableMissions.filter((mission) => mission.districtCode?.trim().toUpperCase() === districtCode)
    : availableMissions;
  const missionsByCode = new Map(availableMissions.filter((mission) => mission.code).map((mission) => [mission.code?.trim().toUpperCase(), mission]));
  const recommendedMissions = detail.recommended_missions.map((mission) => missionsByCode.get(mission.code.trim().toUpperCase()) ?? mission);
  const missionsToShow = placeMissions.length > 0 ? placeMissions : recommendedMissions;

  return (
    <ScrollView
      contentContainerStyle={styles.pagerContent}
      onScroll={onSectionChange}
      ref={scrollRef}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}>
      <View onLayout={(event) => setSectionHeight(0, event)} style={[styles.detailSection, styles.introSection]}>
        {imageUrl ? <Image contentFit="cover" source={{ uri: imageUrl }} style={styles.introImage} /> : <View style={styles.introImagePlaceholder} />}
        <Text style={styles.introTitle}>{detail.title} 소개</Text>
        <Text style={styles.introOverview}>{detail.overview || '이 관광지에 대한 상세 설명이 아직 준비되지 않았어요.'}</Text>

        {tags.length > 0 ? (
          <View style={styles.tagList}>
            {tags.map((tag) => <View key={tag} style={styles.placeTag}><Text style={styles.placeTagText}>{tag}</Text></View>)}
          </View>
        ) : null}

        {detail.pet ? (
          <View style={styles.petSummary}>
            <Text style={styles.petSummaryTitle}>반려동물과 함께하기 좋은 곳</Text>
            <Text style={styles.petSummaryText}>{detail.pet.allowed_companions || detail.pet.accompaniment_type || '반려동물 동반 정보를 확인해보세요.'}</Text>
          </View>
        ) : null}
      </View>

      <View onLayout={(event) => setSectionHeight(1, event)} style={[styles.detailSection, styles.eventSection]}>
        <Text style={styles.pagerSectionTitle}>같이 보면 좋은 <Text style={styles.sectionTitleAccent}>주변 행사</Text></Text>
        {eventsLoading ? <ActivityIndicator color="#659AB3" style={styles.sectionLoader} /> : events.length > 0 ? (
          <View style={styles.eventList}>
            {events.map((event) => <TourismEventCard event={event} key={event.content_id} />)}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>{eventsError || '현재 등록된 주변 행사가 없어요.'}</Text>
          </View>
        )}
      </View>

      <View onLayout={(event) => setSectionHeight(2, event)} style={[styles.detailSection, styles.missionSection]}>
        <Text style={styles.pagerSectionTitle}>이곳에 어울리는 <Text style={styles.sectionTitleAccent}>미션</Text></Text>
        {missionsToShow.length > 0 ? (
          <ScrollView contentContainerStyle={styles.missionCardList} horizontal showsHorizontalScrollIndicator={false} style={styles.missionCardScroller}>
            {missionsToShow.map((mission, index) => (
              <MissionRecommendationCard
                isLast={index === missionsToShow.length - 1}
                key={'mission_id' in mission ? mission.mission_id : mission.id}
                mission={mission}
                onPress={onMissionPress}
              />
            ))}
          </ScrollView>
        ) : <Text style={styles.emptySectionText}>이 장소에 어울리는 미션이 아직 없어요.</Text>}
      </View>
    </ScrollView>
  );
}

export default function TourismPlaceDetailScreen() {
  const { topInset } = useResponsiveLayout();
  const { contentId: contentIdParam } = useLocalSearchParams<{ contentId?: string | string[] }>();
  const contentId = Array.isArray(contentIdParam) ? contentIdParam[0] : contentIdParam;
  const [detail, setDetail] = useState<TourismPlaceDetail | null>(null);
  const [events, setEvents] = useState<TourismPlaceSearchItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [availableMissions, setAvailableMissions] = useState<MissionItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [sectionHeights, setSectionHeights] = useState<number[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const settledSectionRef = useRef(0);
  const isSectionTransitioningRef = useRef(false);

  const snapOffsets = sectionHeights.map((_, index) => sectionHeights.slice(0, index).reduce((total, height) => total + height, 0));

  const openMissionDetail = (mission: MissionItem | TourismMissionRecommendation) => {
    const missionCode = 'mission_id' in mission ? mission.code : mission.code ?? mission.id;

    router.push({
      pathname: '/mission/detail',
      params: {
        missionCode,
        theme: mission.theme ?? '',
      },
    } as never);
  };

  useEffect(() => {
    if (!contentId) {
      setErrorMessage('관광지 정보를 찾을 수 없어요.');
      return;
    }

    const controller = new AbortController();
    setDetail(null);
    setEvents([]);
    setEventsError(null);
    setAvailableMissions([]);
    setSectionHeights([]);
    setActiveSection(0);
    scrollYRef.current = 0;
    settledSectionRef.current = 0;
    isSectionTransitioningRef.current = false;
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

  useEffect(() => {
    if (!detail) {
      return;
    }

    let isActive = true;

    void fetchMissions({})
      .then((missions) => {
        if (isActive) {
          setAvailableMissions(missions);
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [detail]);

  useEffect(() => {
    if (!detail) {
      return;
    }

    const controller = new AbortController();
    setEventsLoading(true);
    setEventsError(null);

    void searchTourismEvents(detail.title, controller.signal)
      .then((response) => setEvents(response.items))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setEventsError('주변 행사 정보를 불러오지 못했어요.');
      })
      .finally(() => setEventsLoading(false));

    return () => controller.abort();
  }, [detail]);

  const setSectionHeight = (index: number, event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setSectionHeights((current) => {
      if (current[index] === height) {
        return current;
      }

      const next = [...current];
      next[index] = height;
      return next;
    });
  };

  const onSectionChange = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = Math.max(event.nativeEvent.contentOffset.y, 0);
    scrollYRef.current = scrollY;
    const currentSection = settledSectionRef.current;
    const currentOffset = snapOffsets[currentSection] ?? 0;
    const nextOffset = snapOffsets[currentSection + 1];
    const previousOffset = snapOffsets[currentSection - 1];
    const distanceFromCurrent = scrollY - currentOffset;
    const nextThreshold = nextOffset === undefined ? Number.POSITIVE_INFINITY : Math.max(180, (nextOffset - currentOffset) * 0.7);
    const previousThreshold = previousOffset === undefined ? Number.POSITIVE_INFINITY : Math.max(180, (currentOffset - previousOffset) * 0.7);

    if (isSectionTransitioningRef.current) {
      const targetOffset = snapOffsets[currentSection] ?? 0;

      if (Math.abs(scrollY - targetOffset) < 8) {
        isSectionTransitioningRef.current = false;
      }
      return;
    }

    if (distanceFromCurrent >= nextThreshold && nextOffset !== undefined) {
      const targetSection = currentSection + 1;
      settledSectionRef.current = targetSection;
      setActiveSection(targetSection);
      isSectionTransitioningRef.current = true;
      scrollRef.current?.scrollTo({ animated: true, y: nextOffset });
      return;
    }

    if (distanceFromCurrent <= -previousThreshold && previousOffset !== undefined) {
      const targetSection = currentSection - 1;
      settledSectionRef.current = targetSection;
      setActiveSection(targetSection);
      isSectionTransitioningRef.current = true;
      scrollRef.current?.scrollTo({ animated: true, y: previousOffset });
    }
  };

  const scrollToSection = (index: number) => {
    settledSectionRef.current = index;
    isSectionTransitioningRef.current = true;
    setActiveSection(index);
    scrollRef.current?.scrollTo({ animated: true, y: snapOffsets[index] ?? 0 });
  };

  return (
    <View style={styles.detailScreenContainer}>
      <View style={styles.detailTopSection}>
        <Svg height="100%" pointerEvents="none" preserveAspectRatio="none" style={StyleSheet.absoluteFill} width="100%">
          <Defs>
            <LinearGradient id="tourism-detail-background" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#BDEAFB" stopOpacity="0.7" />
              <Stop offset="0.24" stopColor="#BDEAFB" stopOpacity="0.32" />
              <Stop offset="0.56" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#tourism-detail-background)" height="100%" width="100%" />
        </Svg>

        <View style={[styles.detailPageHeader, { paddingTop: topInset }]}>
          <TopBar onBack={() => router.back()} title="" />
          <View style={styles.detailHeading}>
            <Text numberOfLines={1} style={styles.detailPageHeaderTitle}>{detail?.title || '관광지 상세'}</Text>
            {detail ? <Text style={styles.detailHeaderAddress}>{getPlaceDistrict(detail.address || detail.detail_address)}</Text> : null}
          </View>
        </View>

        {detail ? (
          <View style={styles.tabBar}>
            {['소개', '행사', '미션'].map((label, index) => (
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: activeSection === index }} key={label} onPress={() => scrollToSection(index)} style={styles.tab}>
                <Text style={[styles.tabText, activeSection === index && styles.tabTextActive]}>{label}</Text>
                {activeSection === index ? <View style={styles.tabIndicator} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {detail ? (
        <PlaceDetailPager
          detail={detail}
          events={events}
          eventsError={eventsError}
          eventsLoading={eventsLoading}
          availableMissions={availableMissions}
          onMissionPress={openMissionDetail}
          onSectionChange={onSectionChange}
          scrollRef={scrollRef}
          setSectionHeight={setSectionHeight}
          snapOffsets={snapOffsets}
        />
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
