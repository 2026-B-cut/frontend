// 지도 화면의 상단 제목과 뒤로가기 영역입니다.
import { router } from 'expo-router';
import { View } from 'react-native';

import { TopBar } from '@/components/top-bar';

import { styles } from '../styles';

export function MapHeader() {
  return (
    <View style={styles.header}>
      <TopBar onBack={() => router.back()} title="부산" />
    </View>
  );
}
