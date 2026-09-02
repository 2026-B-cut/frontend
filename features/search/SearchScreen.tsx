// 관광지 검색 화면의 검색 전, 입력 중, 검색 후 상태를 조립합니다.
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/components/localized-text';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { TourismSearchApiError, normalizeTourismImageUrl, searchTourismPlaces, type TourismPlaceSearchItem } from '@/lib/tourism-api';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, FlatList, Pressable, TextInput as NativeTextInput, View } from 'react-native';

import { useSearch } from './hooks/use-search';
import { styles } from './styles';

const recommendedSearches = ['부산 맛집 투어', '커플 여행코스', '가족과 함께', '아이들이 좋아하는', '바다 근처'];

function getLocation(place: TourismPlaceSearchItem) {
  return place.address || place.detail_address || '부산';
}

function getImageUrl(place: TourismPlaceSearchItem) {
  return normalizeTourismImageUrl(place.thumbnail_url || place.image_url);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function TourismResultCard({ place }: { place: TourismPlaceSearchItem }) {
  const imageUrl = getImageUrl(place);

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.resultHeading}>
          <Text style={styles.resultTitle}>{place.title}</Text>
          <Text style={styles.resultLocation}>{getLocation(place)}</Text>
        </View>
        {imageUrl ? <Image contentFit="cover" source={{ uri: imageUrl }} style={styles.resultImage} /> : <View style={styles.resultImagePlaceholder} />}
      </View>

      <Text style={styles.resultDescription}>
        {place.detail_address || '부산 지역의 관광 정보를 확인해보세요.'}
      </Text>

      <View style={styles.resultTags}>
        <View style={styles.resultTag}>
          <MaterialCommunityIcons color="#659AB3" name="map-marker-outline" size={15} />
          <Text style={styles.resultTagText}>부산 관광지</Text>
        </View>
        <View style={styles.resultTag}>
          <MaterialCommunityIcons color="#659AB3" name="paw" size={15} />
          <Text style={styles.resultTagText}>상세 정보</Text>
        </View>
        <Feather color="#4C88A4" name="arrow-right" size={18} />
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const { topSafeInset } = useResponsiveLayout();
  const inputRef = useRef<NativeTextInput>(null);
  const requestIdRef = useRef(0);
  const [results, setResults] = useState<TourismPlaceSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    query,
    recentSearches,
    setQuery,
    addRecentSearch,
    clearSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearch();
  const hasQuery = Boolean(query.trim());
  const hasMoreResults = results.length < totalCount;

  useEffect(() => {
    const keyword = query.trim();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();

    if (!keyword) {
      setResults([]);
      setTotalCount(0);
      setPage(1);
      setHasSearched(false);
      setIsSearching(false);
      setErrorMessage(null);
      return () => controller.abort();
    }

    setResults([]);
    setTotalCount(0);
    setPage(1);
    setHasSearched(false);
    setErrorMessage(null);
    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      void searchTourismPlaces(keyword, 1, 20, controller.signal)
        .then((response) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setResults(response.items);
          setTotalCount(response.total_count);
          setPage(response.page);
          setHasSearched(true);
          addRecentSearch(keyword);
        })
        .catch((error: unknown) => {
          if (requestIdRef.current !== requestId || isAbortError(error)) {
            return;
          }

          setHasSearched(true);
          setErrorMessage(error instanceof TourismSearchApiError ? error.message : '관광지 검색에 실패했어요.');
        })
        .finally(() => {
          if (requestIdRef.current === requestId) {
            setIsSearching(false);
          }
        });
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [addRecentSearch, query]);

  const loadMoreResults = () => {
    if (!hasSearched || isSearching || isLoadingMore || !hasMoreResults || !query.trim()) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);

    void searchTourismPlaces(query, nextPage, 20)
      .then((response) => {
        setResults((current) => [...current, ...response.items]);
        setTotalCount(response.total_count);
        setPage(response.page);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof TourismSearchApiError ? error.message : '관광지 검색에 실패했어요.');
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };

  const selectSearch = (value: string) => {
    setQuery(value);
    inputRef.current?.focus();
  };

  const showResults = hasQuery && hasSearched && !isSearching;

  return (
    <View style={[styles.container, { paddingTop: topSafeInset + 48 }]}>
      <Text style={styles.title}>관광지 검색</Text>

      <View style={styles.searchField}>
        <Feather color="#8A9194" name="search" size={24} />
        <TextInput
          ref={inputRef}
          maxLength={100}
          onChangeText={setQuery}
          onSubmitEditing={Keyboard.dismiss}
          placeholder="관광지를 검색해주세요..."
          placeholderTextColor="#8A9194"
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        {hasQuery ? (
          <Pressable accessibilityLabel="검색어 지우기" hitSlop={10} onPress={clearSearch} style={styles.clearButton}>
            <Feather color="#FFFFFF" name="x" size={14} />
          </Pressable>
        ) : null}
      </View>

      {showResults ? (
        <FlatList
          contentContainerStyle={styles.resultsContent}
          data={results}
          keyExtractor={(item) => item.content_id}
          ListEmptyComponent={errorMessage ? <Text style={styles.searchMessage}>{errorMessage}</Text> : <Text style={styles.searchMessage}>검색 결과가 없습니다.</Text>}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#74B1C9" style={styles.loadingMore} /> : null}
          onEndReached={loadMoreResults}
          onEndReachedThreshold={0.6}
          renderItem={({ item }) => <TourismResultCard place={item} />}
          showsVerticalScrollIndicator={false}
        />
      ) : hasQuery && isSearching ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#74B1C9" size="small" />
        </View>
      ) : hasQuery && hasSearched && errorMessage ? (
        <View style={styles.errorState}>
          <Text style={styles.searchMessage}>{errorMessage}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={[]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={(
            <>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>최근 검색어</Text>
                {recentSearches.length > 0 ? (
                  <Pressable onPress={clearRecentSearches}>
                    <Text style={styles.deleteAll}>전체 삭제</Text>
                  </Pressable>
                ) : null}
              </View>

              {recentSearches.length > 0 ? (
                <View style={styles.chipList}>
                  {recentSearches.map((item) => (
                    <View key={item} style={styles.recentChip}>
                      <Pressable onPress={() => selectSearch(item)} style={styles.recentChipPressable}>
                        <Text style={styles.recentChipText}>{item}</Text>
                      </Pressable>
                      <Pressable accessibilityLabel={`${item} 검색어 삭제`} hitSlop={8} onPress={() => removeRecentSearch(item)}>
                        <Feather color="#8A9194" name="x" size={14} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyRecent}>최근 검색어가 없습니다</Text>
              )}

              <Text style={[styles.sectionTitle, styles.recommendedTitle]}>추천 검색어</Text>
              <View style={styles.chipList}>
                {recommendedSearches.map((item) => (
                  <Pressable key={item} onPress={() => selectSearch(item)} style={styles.recommendedChip}>
                    <Text style={styles.recommendedChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
