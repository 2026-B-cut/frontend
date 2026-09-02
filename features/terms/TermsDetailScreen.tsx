import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import { ScalePressable } from '@/components/scale-pressable';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { fetchLegalDocuments, getCachedLegalDocument, type LegalDocument, type LegalDocumentType } from '@/lib/auth-api';

function isLegalDocumentType(value: string | string[] | undefined): value is LegalDocumentType {
  const type = Array.isArray(value) ? value[0] : value;
  return type === 'service' || type === 'privacy' || type === 'location';
}

export default function TermsDetailScreen() {
  const { bottomSafeInset, height, horizontalPadding, topSafeInset, width } = useResponsiveLayout();
  const params = useLocalSearchParams<{ document?: string | string[] }>();
  const documentType = isLegalDocumentType(params.document) ? (Array.isArray(params.document) ? params.document[0] : params.document) : null;
  const [document, setDocument] = useState<LegalDocument | null>(() => (documentType ? getCachedLegalDocument(documentType) : null));
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(documentType ? !document : true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    void fetchLegalDocuments()
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (documentType) {
          setDocument(response.documents.find((item) => item.type === documentType) ?? null);
        } else {
          setDocuments(response.documents);
        }

        setErrorMessage('');
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage('약관 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
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
  }, [documentType]);

  const visibleDocuments = documentType ? (document ? [document] : []) : documents;
  const pageTitle = documentType ? document?.title ?? '약관' : '이용 약관';

  return (
    <View style={styles.container}>
      <Svg height={height} pointerEvents="none" preserveAspectRatio="none" style={StyleSheet.absoluteFill} width={width}>
        <Defs>
          <LinearGradient id="terms-detail-background" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#BDEAFB" stopOpacity="0.7" />
            <Stop offset="0.24" stopColor="#BDEAFB" stopOpacity="0.32" />
            <Stop offset="0.56" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#terms-detail-background)" height={height} width={width} />
      </Svg>
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: bottomSafeInset + 38, paddingHorizontal: horizontalPadding, paddingTop: topSafeInset + 32 }}
        showsVerticalScrollIndicator={false}>
        <ScalePressable accessibilityLabel="뒤로 가기" hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#10161F" name="chevron-back" size={29} />
        </ScalePressable>

        <TextBlock style={styles.title}>{pageTitle}</TextBlock>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#63B5CD" />
            <TextBlock style={styles.loadingText}>약관 내용을 불러오는 중입니다.</TextBlock>
          </View>
        ) : errorMessage && visibleDocuments.length === 0 ? (
          <TextBlock style={styles.errorText}>{errorMessage}</TextBlock>
        ) : (
          visibleDocuments.map((item, index) => (
            <View key={`${item.type}-${item.version}`} style={styles.documentSection}>
              {!documentType ? <TextBlock style={styles.documentTitle}>{item.title}</TextBlock> : null}
              <TextBlock style={styles.content}>{item.content}</TextBlock>
              {!documentType && index < visibleDocuments.length - 1 ? <View style={styles.documentDivider} /> : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TextBlock({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={style}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  backButton: {
    alignItems: 'center',
    height: 35,
    justifyContent: 'center',
    marginLeft: -8,
    width: 35,
  },
  title: {
    color: '#10161F',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 35,
    marginTop: 39,
    marginBottom: 20,
  },
  content: {
    color: '#9EA5A9',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  documentSection: {
    paddingTop: 2,
  },
  documentTitle: {
    color: '#10161F',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 27,
    marginTop: 22,
  },
  documentDivider: {
    backgroundColor: '#E7ECEE',
    height: 1,
    marginTop: 30,
  },
  loadingState: {
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    color: '#9EA5A9',
    fontSize: 14,
    marginTop: 14,
  },
  errorText: {
    color: '#8A9194',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 32,
  },
});
