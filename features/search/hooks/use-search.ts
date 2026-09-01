// 검색어 입력 상태를 관리합니다.
import { useState } from 'react';

export function useSearch() {
  const [query, setQuery] = useState('');

  return {
    query,
    setQuery,
  };
}
