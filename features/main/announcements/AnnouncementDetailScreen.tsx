import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import { TopBar } from '@/components/top-bar';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getAnnouncement, markAnnouncementRead, normalizeAnnouncementAssetUrl, type AnnouncementDetail } from '@/lib/announcement-api';

import { styles } from './styles';

function formatDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

export default function AnnouncementDetailScreen() {
  const { contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const idValue = Array.isArray(idParam) ? idParam[0] : idParam;
  const id = Number(idValue);
  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setErrorMessage('공지사항을 찾을 수 없어요.');
      return;
    }

    const controller = new AbortController();
    void getAnnouncement(id, controller.signal)
      .then((value) => {
        setAnnouncement(value);
        if (!value.isRead) {
          void markAnnouncementRead(id).catch(() => undefined);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setErrorMessage(error instanceof Error ? error.message : '공지사항을 불러오지 못했어요.');
        }
      });

    return () => controller.abort();
  }, [id]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { marginHorizontal: horizontalPadding, maxWidth: contentMaxWidth, paddingTop: topInset }]}>
        <TopBar onBack={() => router.back()} title="공지사항" />
      </View>

      {announcement ? (
        <ScrollView contentContainerStyle={[styles.detailContent, { paddingHorizontal: horizontalPadding }]} showsVerticalScrollIndicator={false} style={styles.detailScroll}>
          <Text style={styles.detailTitle}>{announcement.title}</Text>
          <Text style={styles.detailDate}>{formatDate(announcement.publishedAt)}</Text>
          {normalizeAnnouncementAssetUrl(announcement.imageUrl) ? (
            <Image contentFit="cover" source={{ uri: normalizeAnnouncementAssetUrl(announcement.imageUrl) ?? undefined }} style={styles.detailImage} />
          ) : null}
          <Text style={styles.detailBody}>{announcement.content}</Text>
          {announcement.linkUrl ? (
            <ScalePressable onPress={() => void Linking.openURL(announcement.linkUrl as string)} pressedScale={0.98} style={styles.linkButton}>
              <Text style={styles.linkText}>관련 링크 열기</Text>
            </ScalePressable>
          ) : null}
        </ScrollView>
      ) : errorMessage ? (
        <Text style={styles.message}>{errorMessage}</Text>
      ) : (
        <ActivityIndicator color="#74B1C9" style={styles.message} />
      )}
    </View>
  );
}
