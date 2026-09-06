// 프로필 편집 화면의 상단 헤더를 담당합니다.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { ScalePressable } from '@/components/scale-pressable';
import { TopBar } from '@/components/top-bar';

import { styles } from '../styles';

type ProfileEditHeaderProps = {
  contentMaxWidth: number;
  onBack: () => void;
};

export function ProfileEditHeader({ contentMaxWidth, onBack }: ProfileEditHeaderProps) {
  return (
    <View style={{ maxWidth: contentMaxWidth, width: '100%' }}>
      <TopBar
        onBack={onBack}
        rightContent={(
          <ScalePressable accessibilityLabel="설정" onPress={() => {}} pressedScale={0.9} style={styles.iconButton}>
            <MaterialCommunityIcons color="#141820" name="cog-outline" size={25} />
          </ScalePressable>
        )}
        title="프로필 편집"
      />
    </View>
  );
}
