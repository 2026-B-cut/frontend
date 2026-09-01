// 검색 화면에서 사용하는 스타일 모음입니다.
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    color: '#10161F',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 25,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: '#F6F9FB',
    borderRadius: 34,
    flexDirection: 'row',
    height: 48,
    marginTop: 43,
    paddingHorizontal: 30,
  },
  input: {
    color: '#10161F',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    marginLeft: 7,
    paddingVertical: 0,
  },
  sectionTitle: {
    color: '#10161F',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 51,
  },
  recommendedTitle: {
    marginTop: 35,
  },
  notes: {
    marginTop: 71,
  },
  note: {
    color: '#8A9194',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
});
