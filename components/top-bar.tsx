import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { GuardedPressable as Pressable } from '@/components/guarded-pressable';
import { LocalizedText as Text } from '@/components/localized-text';

type TopBarProps = {
  onBack?: () => void;
  rightContent?: ReactNode;
  title: string;
  titleNumberOfLines?: number;
};

export function TopBar({ onBack, rightContent, title, titleNumberOfLines = 1 }: TopBarProps) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={styles.container}>
      <Pressable accessibilityLabel="뒤로 가기" onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text numberOfLines={titleNumberOfLines} style={styles.title}>{title}</Text>
      {rightContent ? <View style={styles.rightSlot}>{rightContent}</View> : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 48,
  },
  backIcon: {
    color: '#202124',
    fontSize: 42,
    lineHeight: 42,
  },
  title: {
    color: '#10161F',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    left: 48,
    position: 'absolute',
    right: 48,
    textAlign: 'center',
    zIndex: 1,
  },
  spacer: {
    width: 48,
  },
  rightSlot: {
    alignItems: 'flex-end',
    width: 48,
  },
});
