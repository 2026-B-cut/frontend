import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  getAdminAnnouncements,
  publishAdminAnnouncement,
  updateAdminAnnouncement,
  type AnnouncementAdmin,
} from '@/lib/announcement-api';

import { styles } from './styles';

type FormState = {
  title: string;
  content: string;
  imageUrl: string;
  linkUrl: string;
  priority: string;
};

const emptyForm: FormState = { content: '', imageUrl: '', linkUrl: '', priority: '0', title: '' };

function formatDate(value: string | null) {
  if (!value) return '-';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

export default function AdminAnnouncementsScreen() {
  const { bottomActionInset, contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();
  const [items, setItems] = useState<AnnouncementAdmin[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<AnnouncementAdmin | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadPage = async (nextPage: number, mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'initial') setIsLoading(true);
    if (mode === 'refresh') setIsRefreshing(true);
    if (mode === 'more') setIsLoadingMore(true);

    try {
      const response = await getAdminAnnouncements(nextPage);
      setItems((current) => (nextPage === 1 ? response.items : [...current, ...response.items]));
      setTotalCount(response.totalCount);
      setPage(response.page);
      setHasNext(response.hasNext);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '운영자 공지사항을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadPage(1, 'initial');
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsModalVisible(true);
  };

  const openEdit = (item: AnnouncementAdmin) => {
    setEditing(item);
    setForm({
      content: item.content,
      imageUrl: item.imageUrl ?? '',
      linkUrl: item.linkUrl ?? '',
      priority: String(item.priority),
      title: item.title,
    });
    setIsModalVisible(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('입력 확인', '제목과 내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const input = {
        content: form.content.trim(),
        imageUrl: form.imageUrl.trim() || null,
        linkUrl: form.linkUrl.trim() || null,
        priority: Math.min(Math.max(Number(form.priority) || 0, 0), 10),
        title: form.title.trim(),
      };

      if (editing) {
        await updateAdminAnnouncement(editing.id, input);
      } else {
        await createAdminAnnouncement(input);
      }

      setIsModalVisible(false);
      await loadPage(1, 'refresh');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '공지사항을 저장하지 못했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublished = async (item: AnnouncementAdmin) => {
    try {
      await publishAdminAnnouncement(item.id, !item.isPublished);
      await loadPage(1, 'refresh');
    } catch (error) {
      Alert.alert('게시 상태 변경 실패', error instanceof Error ? error.message : '게시 상태를 변경하지 못했어요.');
    }
  };

  const remove = (item: AnnouncementAdmin) => {
    Alert.alert('공지 삭제', `${item.title} 공지를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void deleteAdminAnnouncement(item.id)
            .then(() => loadPage(1, 'refresh'))
            .catch((error: unknown) => Alert.alert('삭제 실패', error instanceof Error ? error.message : '공지를 삭제하지 못했어요.'));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { marginHorizontal: horizontalPadding, maxWidth: contentMaxWidth, paddingTop: topInset }]}>
        <ScalePressable accessibilityLabel="뒤로 가기" onPress={() => router.back()} pressedScale={0.86} style={styles.backButton}>
          <MaterialCommunityIcons color="#141820" name="chevron-left" size={36} />
        </ScalePressable>
        <Text style={styles.headerTitle}>운영자 공지 관리</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? <ActivityIndicator color="#74B1C9" style={styles.message} /> : (
        <FlatList
          contentContainerStyle={[styles.content, { paddingBottom: bottomActionInset + 28, paddingHorizontal: horizontalPadding }]}
          data={items}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.message}>{errorMessage || '등록된 공지가 없어요.'}</Text>}
          ListHeaderComponent={(
            <View style={styles.toolbar}>
              <Text style={styles.count}>전체 {totalCount}개</Text>
              <ScalePressable onPress={openCreate} pressedScale={0.98} style={styles.createButton}><Text style={styles.createButtonText}>공지 작성</Text></ScalePressable>
            </View>
          )}
          onEndReached={() => {
            if (!isLoadingMore && hasNext) void loadPage(page + 1, 'more');
          }}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl onRefresh={() => void loadPage(1, 'refresh')} refreshing={isRefreshing} tintColor="#74B1C9" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
                <Text style={[styles.status, item.isPublished ? styles.published : styles.draft]}>{item.isPublished ? '게시됨' : '임시 저장'}</Text>
              </View>
              <Text numberOfLines={3} style={styles.cardContent}>{item.content}</Text>
              <Text style={styles.cardDate}>작성일 {formatDate(item.createdAt)} · 우선순위 {item.priority}</Text>
              <View style={styles.actions}>
                <ScalePressable onPress={() => openEdit(item)} pressedScale={0.98} style={styles.actionButton}><Text style={styles.actionButtonText}>수정</Text></ScalePressable>
                <ScalePressable onPress={() => void togglePublished(item)} pressedScale={0.98} style={styles.actionButton}><Text style={styles.actionButtonText}>{item.isPublished ? '게시 취소' : '게시'}</Text></ScalePressable>
                <ScalePressable onPress={() => remove(item)} pressedScale={0.98} style={[styles.actionButton, styles.deleteButton]}><Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text></ScalePressable>
              </View>
            </View>
          )}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#74B1C9" style={styles.loadingMore} /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal animationType="slide" onRequestClose={() => setIsModalVisible(false)} transparent visible={isModalVisible}>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? '공지 수정' : '공지 작성'}</Text>
              <ScalePressable accessibilityLabel="닫기" onPress={() => setIsModalVisible(false)} pressedScale={0.9} style={styles.closeButton}>
                <MaterialCommunityIcons color="#53666D" name="close" size={24} />
              </ScalePressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>제목</Text>
              <TextInput maxLength={200} onChangeText={(title) => setForm((current) => ({ ...current, title }))} placeholder="공지 제목" style={styles.input} value={form.title} />
              <Text style={styles.label}>내용</Text>
              <TextInput multiline maxLength={20000} onChangeText={(content) => setForm((current) => ({ ...current, content }))} placeholder="공지 내용을 입력해주세요." style={[styles.input, styles.textArea]} textAlignVertical="top" value={form.content} />
              <Text style={styles.label}>이미지 URL (선택)</Text>
              <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))} placeholder="https://..." style={styles.input} value={form.imageUrl} />
              <Text style={styles.label}>링크 URL (선택)</Text>
              <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={(linkUrl) => setForm((current) => ({ ...current, linkUrl }))} placeholder="https://..." style={styles.input} value={form.linkUrl} />
              <Text style={styles.label}>우선순위 (0~10)</Text>
              <TextInput keyboardType="number-pad" maxLength={2} onChangeText={(priority) => setForm((current) => ({ ...current, priority }))} style={styles.input} value={form.priority} />
            </ScrollView>
            <View style={styles.modalActions}>
              <ScalePressable disabled={isSaving} onPress={() => setIsModalVisible(false)} pressedScale={0.98} style={styles.cancelButton}><Text style={styles.cancelButtonText}>취소</Text></ScalePressable>
              <ScalePressable disabled={isSaving} onPress={() => void save()} pressedScale={0.98} style={styles.saveButton}>{isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>저장</Text>}</ScalePressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
