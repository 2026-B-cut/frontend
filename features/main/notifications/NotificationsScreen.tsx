// 알림 설정과 미션 알림 수신 설정을 구성합니다.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  getMissionNotificationPreferences,
  requestMissionNotificationPermission,
  cancelAllMagazineNotifications,
  rescheduleMagazineNotifications,
  setMasterNotificationEnabled,
  setMagazineNotificationEnabled,
  setMissionNotificationEnabled,
  setNightNotificationEnabled,
} from '@/lib/mission-notification';

import { styles } from './styles';

type NotificationRowProps = {
  description?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onToggle?: () => void;
  required?: boolean;
  value: boolean;
  disabled?: boolean;
};

const notificationTypes: NotificationRowProps[] = [
  { icon: 'flag-checkered', label: '미션 알림', value: true },
  { icon: 'book-open-page-variant-outline', label: '매거진 알림', value: true },
  { icon: 'bullhorn-outline', label: '공지 알림', value: true },
];

function NotificationToggle({ disabled = false, onToggle, value }: { disabled?: boolean; onToggle?: () => void; value: boolean }) {
  const toggle = (
    <View accessible={!onToggle} accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} style={[styles.toggleGroup, disabled && styles.disabledToggle]}>
      <View style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}>
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </View>
      <Text style={[styles.toggleState, value ? styles.toggleStateOn : styles.toggleStateOff]}>{value ? '켜짐' : '꺼짐'}</Text>
    </View>
  );

  return onToggle ? (
    <ScalePressable accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={onToggle} pressedScale={0.96}>
      {toggle}
    </ScalePressable>
  ) : toggle;
}

function NotificationRow({ description, disabled, icon, label, onToggle, required, value }: NotificationRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIconWrap}>
        <MaterialCommunityIcons color="#10161F" name={icon} size={25} />
      </View>
      <View style={styles.settingTextGroup}>
        <View style={styles.settingLabelRow}>
          {required ? <Text style={styles.requiredLabel}>필수</Text> : null}
          <Text style={styles.settingLabel}>{label}</Text>
        </View>
        {description ? <Text style={styles.settingDescription}>{description}</Text> : null}
      </View>
      <NotificationToggle disabled={disabled} onToggle={onToggle} value={value} />
    </View>
  );
}

export default function NotificationsScreen() {
  const { bottomActionInset, contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();
  const [isPreferencesReady, setIsPreferencesReady] = useState(false);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [missionEnabled, setMissionEnabled] = useState(true);
  const [magazineEnabled, setMagazineEnabled] = useState(true);
  const [nightEnabled, setNightEnabled] = useState(false);

  useEffect(() => {
    let isActive = true;

    getMissionNotificationPreferences().then((preferences) => {
      if (!isActive) {
        return;
      }

      setMasterEnabled(preferences.masterEnabled);
      setMagazineEnabled(preferences.magazineEnabled);
      setMissionEnabled(preferences.missionEnabled);
      setNightEnabled(preferences.nightEnabled);
      setIsPreferencesReady(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  const enableNotifications = async () => {
    const granted = await requestMissionNotificationPermission();

    if (!granted) {
      Alert.alert('알림 권한 필요', 'Expo Go에서는 시스템 알림을 사용할 수 없습니다. development build에서 알림 권한을 허용해주세요.');
    }

    return granted;
  };

  const handleMasterToggle = async () => {
    const nextValue = !masterEnabled;

    if (nextValue && !(await enableNotifications())) {
      return;
    }

    setMasterEnabled(nextValue);
    await setMasterNotificationEnabled(nextValue);

    if (!nextValue) {
      await cancelAllMagazineNotifications();
    }
  };

  const handleMagazineToggle = async () => {
    const nextValue = !magazineEnabled;

    if (nextValue && !(await enableNotifications())) {
      return;
    }

    setMagazineEnabled(nextValue);
    await setMagazineNotificationEnabled(nextValue);

    if (!nextValue) {
      await cancelAllMagazineNotifications();
    }
  };

  const handleMissionToggle = async () => {
    const nextValue = !missionEnabled;

    if (nextValue && !(await enableNotifications())) {
      return;
    }

    setMissionEnabled(nextValue);
    await setMissionNotificationEnabled(nextValue);
  };

  const handleNightToggle = async () => {
    const nextValue = !nightEnabled;

    setNightEnabled(nextValue);
    await setNightNotificationEnabled(nextValue);
    await rescheduleMagazineNotifications(nextValue);
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
            <Text style={styles.headerTitle}>알림 설정</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.body}>
            <View style={styles.masterCard}>
              <View style={styles.masterIconWrap}>
                <MaterialCommunityIcons color="#10161F" name="bell-ring-outline" size={25} />
              </View>
              <View style={styles.masterTextGroup}>
                <Text style={styles.masterLabel}>알림 수신</Text>
                <Text style={styles.masterDescription}>전체 알림을 한 번에 설정할 수 있어요.</Text>
              </View>
              <NotificationToggle disabled={!isPreferencesReady} onToggle={handleMasterToggle} value={masterEnabled} />
            </View>

            <Text style={styles.sectionTitle}>알림 유형</Text>
            <View style={styles.settingCard}>
              {notificationTypes.map((item) => (
                <NotificationRow
                  key={item.label}
                  {...item}
                  disabled={!isPreferencesReady || ((item.label === '미션 알림' || item.label === '매거진 알림') && !masterEnabled)}
                  onToggle={item.label === '미션 알림' ? handleMissionToggle : item.label === '매거진 알림' ? handleMagazineToggle : undefined}
                  value={item.label === '미션 알림' ? missionEnabled : item.label === '매거진 알림' ? magazineEnabled : item.value}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>추가 수신 동의</Text>
            <View style={styles.settingCard}>
              <NotificationRow
                description="이벤트, 혜택 및 프로모션 소식을 받아요."
                icon="gift-outline"
                label="마케팅 알림 수신 동의"
                required
                value={false}
              />
              <NotificationRow
                description={nightEnabled ? '21:00 ~ 08:00에도 알림을 받을 수 있어요.' : '야간 알림은 오전 8시에 알려드려요.'}
                icon="moon-waning-crescent"
                label="야간 알림 수신 동의"
                disabled={!isPreferencesReady || !masterEnabled}
                onToggle={handleNightToggle}
                value={nightEnabled}
              />
            </View>

            <Text style={styles.sectionTitle}>휴대폰 알림 설정</Text>
            <ScalePressable accessibilityRole="button" onPress={() => {}} pressedScale={0.98} style={styles.systemSettingCard}>
              <View style={styles.settingIconWrap}>
                <MaterialCommunityIcons color="#10161F" name="cellphone-cog" size={25} />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingLabel}>휴대폰 알림 권한</Text>
                <Text style={styles.systemSettingStatus}>현재 알림이 허용되어 있어요.</Text>
              </View>
              <MaterialCommunityIcons color="#8A9194" name="chevron-right" size={27} />
            </ScalePressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
