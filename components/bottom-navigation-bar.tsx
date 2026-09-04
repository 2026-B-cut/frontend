import { Image } from 'expo-image';
import { router, usePathname, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuardedPressable as Pressable } from '@/components/guarded-pressable';
import { useTutorialTarget, type TutorialTargetId } from '@/components/tutorial-provider';

const hiddenPathnames = ['/', '/login', '/terms', '/terms-detail', '/welcome', '/onboarding/step1', '/auth/callback', '/main/waiting', '/main/notifications', '/main/privacy-security', '/trip/participation', '/trip/capture', '/trip/review', '/trip/vote', '/trip/vote-waiting', '/trip/result', '/trip/edit', '/search-detail'];

const navItems: {
  accessibilityLabel: string;
  href: Href;
  icon: number;
  filledIcon?: number;
  match: string[];
  tutorialId?: TutorialTargetId;
  type: 'standard' | 'search';
}[] = [
  {
    accessibilityLabel: '홈',
    href: '/main',
    icon: require('@/assets/svg/navigation_bar/home.svg'),
    filledIcon: require('@/assets/svg/navigation_bar/home_filled.svg'),
    match: ['/main'],
    tutorialId: 'home-nav',
    type: 'standard',
  },
  {
    accessibilityLabel: '지도',
    href: '/map',
    icon: require('@/assets/svg/navigation_bar/map.svg'),
    filledIcon: require('@/assets/svg/navigation_bar/map_filled.svg'),
    match: ['/mission/detail', '/mission/locked', '/map', '/map/district'],
    tutorialId: 'mission-nav',
    type: 'standard',
  },
  {
    accessibilityLabel: '검색',
    href: '/search',
    icon: require('@/assets/svg/navigation_bar/search.svg'),
    match: ['/search'],
    type: 'search',
  },
  {
    accessibilityLabel: '일정',
    href: '/trip/hub',
    icon: require('@/assets/svg/navigation_bar/calendar.svg'),
    filledIcon: require('@/assets/svg/navigation_bar/calendar_filled.svg'),
    match: ['/trip', '/trip/hub', '/trip/invite', '/trip/active', '/trip/after', '/trip/result'],
    type: 'standard',
  },
  {
    accessibilityLabel: '프로필',
    href: '/main/profile',
    icon: require('@/assets/svg/navigation_bar/profile.svg'),
    filledIcon: require('@/assets/svg/navigation_bar/profile_filled.svg'),
    match: ['/main/profile', '/main/profile-edit'],
    tutorialId: 'profile-nav',
    type: 'standard',
  },
];

function isActivePath(pathname: string, matchers: string[]) {
  return matchers.includes(pathname);
}

export function BottomNavigationBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);
  const homeTarget = useTutorialTarget('home-nav', { height: 44, offsetY: 26, width: 44 });
  const missionTarget = useTutorialTarget('mission-nav', { height: 44, offsetY: 26, width: 44 });
  const profileTarget = useTutorialTarget('profile-nav', { height: 44, offsetY: 26, width: 44 });

  if (hiddenPathnames.includes(pathname)) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
      <View style={styles.bar}>
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.match);
          const isSearch = item.type === 'search';
          const tutorialTarget = item.tutorialId === 'home-nav'
            ? homeTarget
            : item.tutorialId === 'mission-nav'
              ? missionTarget
              : item.tutorialId === 'profile-nav'
                ? profileTarget
                : null;

          const handlePress = () => {
            router.push(item.href);
          };

          return (
            <Pressable
              accessibilityLabel={item.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              hitSlop={16}
              key={item.accessibilityLabel}
              onPress={handlePress}
              onLayout={tutorialTarget?.onLayout}
              ref={tutorialTarget?.ref}
              style={[styles.item, isSearch && styles.searchItem]}>
              <View style={[isSearch ? styles.searchButton : styles.iconSlot]}>
                {isSearch ? (
                  <Image contentFit="contain" source={item.icon} style={styles.searchIcon} />
                ) : (
                  <Image
                    contentFit="contain"
                    source={isActive ? item.filledIcon : item.icon}
                    style={styles.navIcon}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const BOTTOM_NAVIGATION_RESERVED_HEIGHT = 52;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
  },
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: BOTTOM_NAVIGATION_RESERVED_HEIGHT,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  item: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'center',
    width: 48,
  },
  searchItem: {
    transform: [{ translateY: -12 }],
    width: 58,
  },
  iconSlot: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#63B5CD',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  searchIcon: {
    height: 20,
    width: 20,
  },
  navIcon: {
    height: 20,
    width: 20,
  },
});
