// 프로필 화면의 헤더와 사용자 아바타 영역을 담당합니다.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { GuardedPressable as Pressable } from '@/components/guarded-pressable';
import { LocalizedText as Text } from '@/components/localized-text';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ScalePressable } from '@/components/scale-pressable';
import { TopBar } from '@/components/top-bar';
import { useTutorialTarget } from '@/components/tutorial-provider';

import { styles } from '../styles';

type ProfileHeaderProps = {
  contentMaxWidth: number;
  horizontalPadding: number;
  nickname: string;
  onBack: () => void;
  onEdit: () => void;
  onOpenSettings: () => void;
  profileEmoji: string | null;
  profileImageUrl: string | null;
  topInset: number;
};

export function ProfileHeader({
  contentMaxWidth,
  horizontalPadding,
  nickname,
  onBack,
  onEdit,
  onOpenSettings,
  profileEmoji,
  profileImageUrl,
  topInset,
}: ProfileHeaderProps) {
  const profileEditTarget = useTutorialTarget('profile-edit', { height: 140, offsetY: 27, width: 140 });

  return (
    <View style={[styles.profileSection, { paddingHorizontal: horizontalPadding, paddingTop: topInset }]}>
      <View style={{ maxWidth: contentMaxWidth, width: '100%' }}>
        <TopBar
          onBack={onBack}
          rightContent={(
            <ScalePressable accessibilityLabel="설정" onPress={onOpenSettings} pressedScale={0.9} style={styles.iconButton}>
              <MaterialCommunityIcons color="#141820" name="cog-outline" size={25} />
            </ScalePressable>
          )}
          title="프로필 편집"
        />
      </View>

      <View style={styles.profileInfo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="프로필 편집"
          onLayout={profileEditTarget.onLayout}
          onPress={onEdit}
          ref={profileEditTarget.ref}
          style={styles.avatarButton}>
          <ProfileAvatar profileImageUrl={profileImageUrl} profileEmoji={profileEmoji} />
          <View style={styles.editBadge}>
            <MaterialCommunityIcons color="#4E5259" name="pencil" size={20} />
          </View>
        </Pressable>
        <Text style={styles.username}>{nickname}</Text>
      </View>
    </View>
  );
}
