// 알림 설정의 UI를 구성합니다. 알림 기능 연결은 추후 추가합니다.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { styles } from './styles';

type NotificationRowProps = {
  description?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  required?: boolean;
  value: boolean;
};

const notificationTypes: NotificationRowProps[] = [
  { icon: 'flag-checkered', label: '미션 알림', value: true },
  { icon: 'book-open-page-variant-outline', label: '매거진 알림', value: true },
  { icon: 'bullhorn-outline', label: '공지 알림', value: true },
];

function StaticToggle({ value }: { value: boolean }) {
  return (
    <View accessible accessibilityRole="switch" accessibilityState={{ checked: value, disabled: true }} style={styles.toggleGroup}>
      <View style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}>
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </View>
      <Text style={[styles.toggleState, value ? styles.toggleStateOn : styles.toggleStateOff]}>{value ? '켜짐' : '꺼짐'}</Text>
    </View>
  );
}

function NotificationRow({ description, icon, label, required, value }: NotificationRowProps) {
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
      <StaticToggle value={value} />
    </View>
  );
}

export default function NotificationsScreen() {
  const { bottomActionInset, contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();

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
            <StaticToggle value />
            </View>

            <Text style={styles.sectionTitle}>알림 유형</Text>
            <View style={styles.settingCard}>
              {notificationTypes.map((item) => <NotificationRow key={item.label} {...item} />)}
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
                description="21:00 ~ 08:00에도 알림을 받을 수 있어요."
                icon="moon-waning-crescent"
                label="야간 알림 수신 동의"
                value={false}
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
