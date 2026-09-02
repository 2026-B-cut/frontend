import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { fetchLegalDocuments, type LegalDocument, type LegalDocumentType } from '@/lib/auth-api';

type PermissionKey = 'location' | 'camera';

type PermissionState = {
  canAskAgain: boolean;
  granted: boolean;
};

type PermissionResponseLike = PermissionState;

const defaultPermissionState: Record<PermissionKey, PermissionState> = {
  camera: { canAskAgain: true, granted: false },
  location: { canAskAgain: true, granted: false },
};

const permissionItems: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  key: PermissionKey;
  label: string;
  reason: string;
}[] = [
  {
    icon: 'map-marker-outline',
    key: 'location',
    label: '위치',
    reason: '여행 위치 기록과 주변 장소 추천을 위해 사용합니다.',
  },
  {
    icon: 'camera-outline',
    key: 'camera',
    label: '카메라',
    reason: '미션 사진을 촬영하기 위해 사용합니다.',
  },
];

const policyTitles: Record<LegalDocumentType, string> = {
  location: '위치기반서비스 이용약관',
  privacy: '개인정보처리방침',
  service: '서비스 이용약관',
};

const dataItems: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  message: string;
}[] = [
  {
    icon: 'file-account-outline',
    label: '내 개인정보 열람',
    message: '개인정보 열람 요청 기능은 서버 API 연결 후 사용할 수 있습니다.',
  },
  {
    icon: 'text-box-remove-outline',
    label: '동의 철회',
    message: '동의 철회 기능은 서버 API 연결 후 사용할 수 있습니다.',
  },
];

export default function PrivacySecurityScreen() {
  const { bottomActionInset, contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [documentsError, setDocumentsError] = useState('');
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [permissions, setPermissions] = useState(defaultPermissionState);
  const [loadingPermission, setLoadingPermission] = useState<PermissionKey | null>(null);

  const loadPermissions = useCallback(async () => {
    try {
      const [location, camera] = await Promise.all([
        getLocationPermission(),
        getCameraPermission(),
      ]);

      setPermissions({ camera, location });
    } catch {
      // 권한 상태를 읽을 수 없는 환경에서는 기본값을 유지합니다.
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);

    try {
      const response = await fetchLegalDocuments();
      setDocuments(response.documents);
      setDocumentsError('');
    } catch {
      setDocumentsError('약관을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPermissions();
      void loadDocuments();
    }, [loadDocuments, loadPermissions]),
  );

  const openSystemSettings = () => {
    void Linking.openSettings().catch(() => {
      Alert.alert('설정 열기 실패', '휴대폰 설정에서 앱 권한을 직접 변경해 주세요.');
    });
  };

  const requestPermission = async (key: PermissionKey) => {
    setLoadingPermission(key);

    try {
      const current = permissions[key];

      if (!current.canAskAgain && !current.granted) {
        Alert.alert('권한이 필요합니다', '권한을 변경하려면 휴대폰 설정에서 허용해 주세요.', [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: openSystemSettings },
        ]);
        return;
      }

      const next = await askForPermission(key);
      setPermissions((previous) => ({ ...previous, [key]: next }));
    } catch {
      Alert.alert('권한 요청 실패', '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoadingPermission(null);
    }
  };

  const handlePermissionToggle = (key: PermissionKey, enabled: boolean) => {
    if (enabled) {
      void requestPermission(key);
      return;
    }

    Alert.alert('권한 관리', '권한을 끄려면 휴대폰 설정에서 변경해 주세요.', [
      { text: '취소', style: 'cancel' },
      { text: '설정 열기', onPress: openSystemSettings },
    ]);
  };

  const showDataActionInfo = (label: string, message: string) => {
    Alert.alert(label, message, [{ text: '확인' }]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomActionInset + 28, paddingHorizontal: horizontalPadding, paddingTop: topInset }}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.header}>
            <ScalePressable accessibilityLabel="뒤로 가기" onPress={() => router.back()} pressedScale={0.86} style={styles.backButton}>
              <MaterialCommunityIcons color="#141820" name="chevron-left" size={36} />
            </ScalePressable>
            <Text style={styles.headerTitle}>개인정보 / 보안</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.body}>
            <Text style={styles.sectionTitle}>약관 및 정책</Text>
            <View style={styles.settingCard}>
            {isLoadingDocuments ? (
              <Text style={styles.helperText}>약관을 불러오는 중입니다.</Text>
            ) : documentsError ? (
              <Text style={styles.helperText}>{documentsError}</Text>
            ) : (
              documents.map((document) => (
                <PolicyRow
                  document={document}
                  key={`${document.type}-${document.version}`}
                  onPress={() => router.push({ pathname: '/terms-detail', params: { document: document.type } })}
                />
              ))
            )}
            </View>

            <Text style={styles.sectionTitle}>앱 권한</Text>
            <View style={styles.settingCard}>
              {permissionItems.map((item) => (
                <PermissionRow
                  icon={item.icon}
                  isLoading={loadingPermission === item.key}
                  isGranted={permissions[item.key].granted}
                  key={item.key}
                  label={item.label}
                  reason={item.reason}
                  onToggle={(enabled) => handlePermissionToggle(item.key, enabled)}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>내 데이터 관리</Text>
            <View style={styles.settingCard}>
              {dataItems.map((item) => (
                <ActionRow
                  icon={item.icon}
                  key={item.label}
                  label={item.label}
                  onPress={() => showDataActionInfo(item.label, item.message)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PolicyRow({ document, onPress }: { document: LegalDocument; onPress: () => void }) {
  return (
    <ScalePressable accessibilityRole="button" onPress={onPress} pressedScale={0.98} style={styles.settingRow}>
      <View style={styles.settingIconWrap}>
        <MaterialCommunityIcons color="#10161F" name="file-document-outline" size={25} />
      </View>
      <View style={styles.settingTextGroup}>
        <Text style={styles.settingLabel}>{policyTitles[document.type]}</Text>
      </View>
      <MaterialCommunityIcons color="#8A9194" name="chevron-right" size={26} />
    </ScalePressable>
  );
}

function PermissionRow({
  icon,
  isLoading,
  isGranted,
  label,
  reason,
  onToggle,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isLoading: boolean;
  isGranted: boolean;
  label: string;
  reason: string;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIconWrap}>
        <MaterialCommunityIcons color="#10161F" name={icon} size={25} />
      </View>
      <View style={styles.settingTextGroup}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{reason}</Text>
      </View>
      <PermissionToggle disabled={isLoading} onToggle={() => onToggle(!isGranted)} value={isGranted} />
    </View>
  );
}

function ActionRow({ icon, label, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress: () => void }) {
  return (
    <ScalePressable accessibilityRole="button" onPress={onPress} pressedScale={0.98} style={styles.settingRow}>
      <View style={styles.settingIconWrap}>
        <MaterialCommunityIcons color="#10161F" name={icon} size={25} />
      </View>
      <View style={styles.settingTextGroup}>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <MaterialCommunityIcons color="#8A9194" name="chevron-right" size={26} />
    </ScalePressable>
  );
}

function PermissionToggle({ disabled = false, onToggle, value }: { disabled?: boolean; onToggle: () => void; value: boolean }) {
  const toggle = (
    <View accessible={!onToggle} accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} style={[styles.toggleGroup, disabled && styles.disabledToggle]}>
      <View style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}>
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </View>
      <Text style={[styles.toggleState, value ? styles.toggleStateOn : styles.toggleStateOff]}>{value ? '켜짐' : '꺼짐'}</Text>
    </View>
  );

  return (
    <ScalePressable accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={onToggle} pressedScale={0.96}>
      {toggle}
    </ScalePressable>
  );
}

async function getLocationPermission(): Promise<PermissionResponseLike> {
  const permission = await Location.getForegroundPermissionsAsync();
  return { canAskAgain: permission.canAskAgain, granted: permission.granted };
}

async function getCameraPermission(): Promise<PermissionResponseLike> {
  const permission = await Camera.getCameraPermissionsAsync();
  return { canAskAgain: permission.canAskAgain, granted: permission.granted };
}

async function askForPermission(key: PermissionKey): Promise<PermissionResponseLike> {
  if (key === 'location') {
    const permission = await Location.requestForegroundPermissionsAsync();
    return { canAskAgain: permission.canAskAgain, granted: permission.granted };
  }

  const permission = await Camera.requestCameraPermissionsAsync();
  return { canAskAgain: permission.canAskAgain, granted: permission.granted };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  inner: {
    width: '100%',
  },
  body: {
    paddingHorizontal: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'flex-start',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTitle: {
    color: '#10161F',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  sectionTitle: {
    color: '#53666D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 26,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 0,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingVertical: 14,
  },
  settingIconWrap: {
    alignItems: 'center',
    height: 25,
    justifyContent: 'center',
    marginRight: 16,
    width: 25,
  },
  settingTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  settingLabel: {
    color: '#10161F',
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    color: '#8A9194',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  helperText: {
    color: '#8A9194',
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 14,
  },
  toggleGroup: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  disabledToggle: {
    opacity: 0.5,
  },
  toggle: {
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 48,
  },
  toggleOn: {
    backgroundColor: '#64ABBF',
  },
  toggleOff: {
    backgroundColor: '#D9E4E7',
  },
  toggleThumb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 22,
    position: 'absolute',
    top: 3,
    width: 22,
  },
  toggleThumbOn: {
    right: 3,
  },
  toggleThumbOff: {
    left: 3,
  },
  toggleState: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  toggleStateOn: {
    color: '#287D95',
  },
  toggleStateOff: {
    color: '#8A9194',
  },
});
