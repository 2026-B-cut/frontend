// 관광지 검색 화면을 조립합니다.
import { LocalizedText as Text } from '@/components/localized-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Feather } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

import { useSearch } from './hooks/use-search';
import { styles } from './styles';

export default function SearchScreen() {
  const { topSafeInset } = useResponsiveLayout();
  const { query, setQuery } = useSearch();

  return (
    <View style={[styles.container, { paddingTop: topSafeInset + 56 }]}>
      <Text style={styles.title}>관광지 검색</Text>

      <View style={styles.searchField}>
        <Feather color="#8A9194" name="search" size={23} />
        <TextInput
          onChangeText={setQuery}
          placeholder="관광지 검색해주세요..."
          placeholderTextColor="#8A9194"
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
      </View>

      <Text style={styles.sectionTitle}>최근 검색어</Text>
      <Text style={[styles.sectionTitle, styles.recommendedTitle]}>추천 검색어</Text>

      <View style={styles.notes}>
        <Text style={styles.note}>돌아갈 내용-지역/위치/이미지/행사.축제 정보/소개정보/반려동물 정보</Text>
        <Text style={styles.note}>상단에 지역-위치</Text>
        <Text style={styles.note}>메인에 이미지+상세 소개 정보</Text>
        <Text style={styles.note}>하단에 행사 축제 정보 및 반려동물 정보</Text>
      </View>
    </View>
  );
}
