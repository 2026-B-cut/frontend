// 검색어 입력 상태를 관리합니다.
import { useCallback, useState } from 'react';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const addRecentSearch = useCallback((value: string) => {
    const nextQuery = value.trim();

    if (!nextQuery) {
      return;
    }

    setRecentSearches((current) => [nextQuery, ...current.filter((item) => item !== nextQuery)].slice(0, 5));
  }, []);

  const replaceRecentSearches = useCallback((values: string[]) => {
    setRecentSearches(values.map((value) => value.trim()).filter(Boolean).slice(0, 5));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const removeRecentSearch = useCallback((value: string) => {
    setRecentSearches((current) => current.filter((item) => item !== value));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    query,
    recentSearches,
    setQuery: updateQuery,
    addRecentSearch,
    replaceRecentSearches,
    clearSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}
