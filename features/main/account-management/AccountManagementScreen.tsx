// 로그인 계정과 활동 정보를 확인하는 계정 관리 화면입니다.
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { TopBar } from '@/components/top-bar';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { ProfileAccountSummary } from '../profile/components/profile-account-summary';
import { useProfileScreen } from '../profile/hooks/use-profile-screen';
import { styles } from '../profile/styles';

export default function AccountManagementScreen() {
  const { contentMaxWidth, horizontalPadding, topInset } = useResponsiveLayout();
  const profile = useProfileScreen({
    onSignedOut: () => {
      router.dismissAll();
      router.replace('/login');
    },
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.accountPageContainer}>
      <View style={[styles.accountPageHeader, { paddingHorizontal: horizontalPadding, paddingTop: topInset }]}>
        <View style={{ maxWidth: contentMaxWidth, width: '100%' }}>
          <TopBar onBack={() => router.back()} title="계정 관리" />
        </View>
      </View>

      <ProfileAccountSummary
        completedMissionCount={profile.completedMissionCount}
        contentMaxWidth={contentMaxWidth}
        createdAt={profile.createdAt}
        createdMagazineCount={profile.createdMagazineCount}
        email={profile.email}
        horizontalPadding={horizontalPadding}
        isLoading={profile.isProfileLoading}
        nickname={profile.nickname}
        provider={profile.provider}
      />
    </ScrollView>
  );
}
