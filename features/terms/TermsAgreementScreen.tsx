import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  AuthApiError,
  fetchLegalDocuments,
  saveTermsConsent,
  type LegalDocument,
  type LegalDocumentType,
} from '@/lib/auth-api';
import { getAuthItem } from '@/lib/auth-storage';
import { getRequestErrorMessage } from '@/lib/auth-error';


const checkIcon = require('@/assets/svg/terms/check.svg');
const nonCheckIcon = require('@/assets/svg/terms/non_check.svg');

export default function TermsAgreementScreen() {
  const { bottomSafeInset, height, horizontalPadding } = useResponsiveLayout();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null);
  const [selectedTerms, setSelectedTerms] = useState<LegalDocumentType[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const requiredDocuments = useMemo(() => documents.filter((document) => document.required), [documents]);
  const allSelected = requiredDocuments.length > 0 && requiredDocuments.every(({ type }) => selectedTerms.includes(type));

  useEffect(() => {
    let isActive = true;

    const loadScreen = async () => {
      if (!getAuthItem('access_token')) {
        router.replace('/login');
        return;
      }

      try {
        const response = await fetchLegalDocuments();

        if (!isActive) {
          return;
        }

        setRequiredVersion(response.required_version);
        setDocuments(response.documents);
        setErrorMessage('');
      } catch (error) {
        if (isActive) {
          setErrorMessage(getRequestErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadScreen();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selectedTerms), [selectedTerms]);

  const toggleTerm = (id: LegalDocumentType) => {
    setSelectedTerms((current) => (current.includes(id) ? current.filter((termId) => termId !== id) : [...current, id]));
  };

  const toggleAll = () => {
    setSelectedTerms(allSelected ? [] : requiredDocuments.map((document) => document.type));
  };

  const completeAgreement = async () => {
    if (!getAuthItem('access_token') || !allSelected || isCompleting) {
      return;
    }

    if (!requiredVersion) {
      return;
    }

    setIsCompleting(true);

    try {
      const agreements: Record<LegalDocumentType, boolean> = {
        location: selectedTerms.includes('location'),
        privacy: selectedTerms.includes('privacy'),
        service: selectedTerms.includes('service'),
      };

      await saveTermsConsent(requiredVersion, agreements);
      // 기존 약관 완료 후 온보딩 첫 단계로 진입하는 흐름을 유지합니다.
      router.replace('/onboarding/step1');
    } catch (error) {
      if (error instanceof AuthApiError && error.code === 'TERMS_VERSION_MISMATCH') {
        try {
          const latest = await fetchLegalDocuments(true);
          setRequiredVersion(latest.required_version);
          setDocuments(latest.documents);
          setSelectedTerms([]);
          setErrorMessage('약관이 업데이트되어 최신 내용을 다시 확인해 주세요.');
        } catch (refreshError) {
          setErrorMessage(getRequestErrorMessage(refreshError));
        }
      } else {
        setErrorMessage(getRequestErrorMessage(error));
      }
    } finally {
      setIsCompleting(false);
    }
  };

  if (!getAuthItem('access_token') || isLoading) {
    return <View style={styles.emptyScreen} />;
  }

  if (errorMessage && documents.length === 0) {
    return (
      <View style={styles.errorScreen}>
        <TextBlock style={styles.errorText}>{errorMessage}</TextBlock>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.sheet, { height: Math.min(Math.max(height * 0.58, 480), 580), paddingBottom: Math.max(bottomSafeInset + 20, 38) }]}>
        <View style={[styles.sheetContent, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.headingRow}>
              <View style={styles.sheetTitleLine}>
                <TextBlock style={styles.sheetTitle}>약관에 동의해 주세요</TextBlock>
            </View>
          </View>

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: allSelected }} onPress={toggleAll} style={styles.selectAllButton}>
            <Image source={allSelected ? checkIcon : nonCheckIcon} style={styles.checkIcon} />
            <TextBlock style={[styles.selectAllText, allSelected && styles.selectAllTextSelected]}>필수 항목 모두 체크하기</TextBlock>
          </Pressable>

          <TextBlock style={styles.groupLabel}>찌그까 서비스 약관</TextBlock>

          <View style={styles.termList}>
            {requiredDocuments.map((document) => {
              const isSelected = selectedSet.has(document.type);

              return (
                <View key={document.type} style={styles.termRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => toggleTerm(document.type)}
                    style={styles.termCheckButton}>
                    <Image source={isSelected ? checkIcon : nonCheckIcon} style={styles.rowCheck} />
                    <TextBlock style={styles.termLabel}>{`[필수] ${document.title}`}</TextBlock>
                  </Pressable>
                  <Pressable accessibilityLabel={`${document.title} 상세 보기`} onPress={() => router.push({ pathname: '/terms-detail', params: { document: document.type } })} style={styles.detailButton}>
                    <Text style={styles.detailChevron}>›</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!allSelected || isCompleting}
            onPress={completeAgreement}
            style={[styles.completeButton, allSelected && styles.completeButtonSelected]}>
            {!isCompleting ? (
              <TextBlock style={[styles.completeButtonTextOverlay, allSelected && styles.completeButtonTextSelected]}>{'\uC644\uB8CC'}</TextBlock>
            ) : null}
            {isCompleting ? <ActivityIndicator color="#63B5CD" /> : <TextBlock style={styles.completeButtonText}>완료</TextBlock>}
          </Pressable>
          {errorMessage ? <TextBlock style={styles.errorText}>{errorMessage}</TextBlock> : null}
        </View>
      </View>
    </View>
  );
}

function TextBlock({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  // 약관 화면은 번역 대상이 아니므로 원문을 그대로 노출합니다.
  return <Text style={style}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  emptyScreen: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  errorScreen: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#8A9194',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
  },
  sheetContent: {
    flex: 1,
    paddingTop: 27,
  },
  headingRow: {
    marginBottom: 25,
  },
  sheetTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sheetTitle: {
    color: '#10161F',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.7,
  },
  selectAllButton: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  checkIcon: {
    height: 24,
    width: 24,
  },
  selectAllText: {
    color: '#8A9194',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 14,
  },
  selectAllTextSelected: {
    color: '#667276',
  },
  groupLabel: {
    color: '#6F7376',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 38,
    marginBottom: 13,
  },
  termList: {
    gap: 1,
  },
  termRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 34,
  },
  termCheckButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 34,
  },
  rowCheck: {
    height: 24,
    width: 24,
  },
  termLabel: {
    color: '#6F7376',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 11,
  },
  detailButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 33,
  },
  detailChevron: {
    color: '#8A9194',
    fontSize: 35,
    fontWeight: '400',
    lineHeight: 31,
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: '#E3F0F6',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 63,
  },
  completeButtonSelected: {
    backgroundColor: '#63B5CD',
  },
  completeButtonText: {
    color: 'transparent',
    fontSize: 16,
    fontWeight: '500',
  },
  completeButtonTextOverlay: {
    color: '#409CB7',
    fontSize: 16,
    fontWeight: '500',
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  completeButtonTextSelected: {
    color: '#FFFFFF',
  },
});
