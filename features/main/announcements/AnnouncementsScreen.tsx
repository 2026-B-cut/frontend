import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import { TopBar } from '@/components/top-bar';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getAnnouncements, type AnnouncementListItem } from '@/lib/announcement-api';

import { styles } from './styles';

function formatDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

export default function AnnouncementsScreen() {
  const { bottomActionInset, contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();
  const [items, setItems] = useState<AnnouncementListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPage = async (nextPage: number, mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'initial') setIsLoading(true);
    if (mode === 'refresh') setIsRefreshing(true);
    if (mode === 'more') setIsLoadingMore(true);

    try {
      const response = await getAnnouncements(nextPage);
      setItems((current) => (nextPage === 1 ? response.items : [...current, ...response.items]));
      setPage(response.page);
      setHasNext(response.hasNext);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '공지사항을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadPage(1, 'initial');
  }, []);

  const openAnnouncement = (item: AnnouncementListItem) => {
    router.push({ pathname: '/main/announcements/[id]', params: { id: String(item.id) } } as never);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.listHeader, { marginHorizontal: horizontalPadding, maxWidth: contentMaxWidth, paddingTop: topInset }]}>
        <TopBar onBack={() => router.back()} title="공지사항" />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#74B1C9" style={styles.message} />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomActionInset + 28, paddingHorizontal: horizontalPadding }]}
          data={items}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyMessage}>{errorMessage || '등록된 공지사항이 없어요.'}</Text>
            </View>
          }
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#74B1C9" style={styles.loadingMore} /> : null}
          onEndReached={() => {
            if (!isLoadingMore && hasNext) {
              void loadPage(page + 1, 'more');
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl onRefresh={() => void loadPage(1, 'refresh')} refreshing={isRefreshing} tintColor="#74B1C9" />}
          renderItem={({ item }) => (
            <ScalePressable onPress={() => openAnnouncement(item)} pressedScale={0.98} style={styles.item}>
              <View style={styles.itemHeader}>
                {!item.isRead ? <View style={styles.unreadDot} /> : null}
                <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
                {item.priority > 0 ? <Text style={styles.priority}>중요</Text> : null}
              </View>
              <Text numberOfLines={2} style={styles.summary}>{item.summary}</Text>
              <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
            </ScalePressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
