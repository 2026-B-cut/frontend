import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
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
  const documentType = isLegalDocumentType(params.document) ? (Array.isArray(params.document) ? params.document[0] : params.document) : 'service';
  const [document, setDocument] = useState<LegalDocument | null>(() => getCachedLegalDocument(documentType));

  useEffect(() => {
    let isActive = true;

    if (document) {
      return () => {
        isActive = false;
      };
    }

    void fetchLegalDocuments()
      .then((response) => {
        if (isActive) {
          setDocument(response.documents.find((item) => item.type === documentType) ?? null);
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [document, documentType]);

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

        <TextBlock style={styles.title}>{document?.title ?? '약관'}</TextBlock>
        <TextBlock style={styles.content}>{document?.content ?? '약관 내용을 불러오는 중입니다.'}</TextBlock>
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
});
