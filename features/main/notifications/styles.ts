// 알림 설정 화면에서 사용하는 스타일 모음입니다.
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  inner: {
    width: '100%',
  },
  body: {
    paddingHorizontal: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'flex-start',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTitle: {
    color: '#10161F',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  masterCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    marginTop: 36,
    minHeight: 92,
    paddingHorizontal: 0,
  },
  masterIconWrap: {
    alignItems: 'center',
    height: 25,
    justifyContent: 'center',
    marginRight: 16,
    width: 25,
  },
  masterTextGroup: {
    flex: 1,
  },
  masterLabel: {
    color: '#10161F',
    fontSize: 16,
    fontWeight: '500',
  },
  masterDescription: {
    color: '#8A9194',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  sectionTitle: {
    color: '#53666D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 26,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 0,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingVertical: 14,
  },
  settingIconWrap: {
    alignItems: 'center',
    height: 25,
    justifyContent: 'center',
    marginRight: 16,
    width: 25,
  },
  settingTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  settingLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  settingLabel: {
    color: '#10161F',
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  requiredLabel: {
    color: '#287D95',
    fontSize: 11,
    fontWeight: '700',
  },
  settingDescription: {
    color: '#8A9194',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  toggleGroup: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  toggle: {
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 48,
  },
  toggleOn: {
    backgroundColor: '#64ABBF',
  },
  toggleOff: {
    backgroundColor: '#D9E4E7',
  },
  toggleThumb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 22,
    position: 'absolute',
    top: 3,
    width: 22,
  },
  toggleThumbOn: {
    right: 3,
  },
  toggleThumbOff: {
    left: 3,
  },
  toggleState: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  toggleStateOn: {
    color: '#287D95',
  },
  toggleStateOff: {
    color: '#8A9194',
  },
  systemSettingCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 0,
  },
  systemSettingStatus: {
    color: '#64ABBF',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});
