// main 홈 화면을 구성하고 매거진 상세 이동을 연결합니다.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, type LayoutChangeEvent, View } from 'react-native';

import { TUTORIAL_AUTO_START_ENABLED, useTutorial } from '@/components/tutorial-provider';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { EmptyMagazineState } from './components/empty-magazine-state';
import { MainHeader } from './components/main-header';
import { MagazineCard } from './components/magazine-card';
import { useMainHome } from './hooks/use-main-home';
import { styles } from './styles';

export default function MainHomeScreen() {
  const { centerContentOffset, horizontalPadding, topInset } = useResponsiveLayout();
  const main = useMainHome();
  const { start: startTutorial } = useTutorial();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [homeViewportHeight, setHomeViewportHeight] = useState(0);
  const shouldShowEmptyMagazine = main.hasLoadedMagazine && main.magazines.length === 0;
  const hasCheckedWelcome = true;

  const handleHomeViewportLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    if (nextHeight > 0 && nextHeight !== homeViewportHeight) {
      setHomeViewportHeight(nextHeight);
    }
  };

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    if (nextHeight > 0 && nextHeight !== headerHeight) {
      setHeaderHeight(nextHeight);
    }
  };

  const magazineCardHeight = Math.max(homeViewportHeight - headerHeight - 56, 0);

  const openMagazine = (scheduleId: string) => {
    router.push({
      pathname: '/magazine/detail',
      params: { scheduleId },
    });
  };

  useEffect(() => {
    if (TUTORIAL_AUTO_START_ENABLED && shouldShowEmptyMagazine && hasCheckedWelcome) {
      void startTutorial();
    }
  }, [hasCheckedWelcome, shouldShowEmptyMagazine, startTutorial]);

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <ScrollView
        contentContainerStyle={styles.homeScrollContent}
        onLayout={handleHomeViewportLayout}
        showsVerticalScrollIndicator={false}
        style={styles.homeScroll}
      >
        <MainHeader
          onLayout={handleHeaderLayout}
          onOpenProfile={() => router.push('/main/profile')}
          profileEmoji={main.profileEmoji}
          profileImageUrl={main.profileImageUrl}
          topInset={topInset}
        />

        {shouldShowEmptyMagazine ? (
          <View style={{ height: magazineCardHeight }}>
            <EmptyMagazineState centerContentOffset={centerContentOffset} />
          </View>
        ) : main.hasLoadedMagazine ? (
          <View style={styles.magazineList}>
            {main.magazines.map((magazine) => (
              <View key={magazine.scheduleId} style={[styles.magazineItem, { height: magazineCardHeight }]}>
                <MagazineCard
                  isLoading={main.isMagazineLoading}
                  magazinePreviewUrl={magazine.magazinePreviewUrl}
                  onPress={() => openMagazine(magazine.scheduleId)}
                  photoUrls={magazine.photoUrls}
                  scheduleId={magazine.scheduleId}
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

    </View>
  );
}
