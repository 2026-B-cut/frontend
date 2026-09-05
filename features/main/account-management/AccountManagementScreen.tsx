// 로그인 계정과 활동 정보를 확인하는 계정 관리 화면입니다.
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';

import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { ProfileAccountSummary } from '../profile/components/profile-account-summary';
import { useProfileScreen } from '../profile/hooks/use-profile-screen';
import { styles } from '../profile/styles';

export default function AccountManagementScreen() {
  const { contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();
  const profile = useProfileScreen({ onSignedOut: () => router.replace('/login') });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.accountPageContainer}>
      <View style={[styles.accountPageHeader, { paddingHorizontal: horizontalPadding, paddingTop: topInset }]}>
        <View style={[styles.header, { maxWidth: contentMaxWidth }]}> 
          <ScalePressable accessibilityLabel="뒤로 가기" onPress={() => router.back()} pressedScale={0.86} style={styles.iconButton}>
            <MaterialCommunityIcons color="#141820" name="chevron-left" size={36} />
          </ScalePressable>
          <Text style={styles.headerTitle}>계정 관리</Text>
          <View style={styles.iconButton} />
        </View>
      </View>

      <ProfileAccountSummary
        completedMissionCount={profile.completedMissionCount}
        contentMaxWidth={contentMaxWidth}
        createdAt={profile.createdAt}
        createdMagazineCount={profile.createdMagazineCount}
        email={profile.email}
        horizontalPadding={horizontalPadding}
        nickname={profile.nickname}
        provider={profile.provider}
      />
    </ScrollView>
  );
}
