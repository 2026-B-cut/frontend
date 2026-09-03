import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginTop: 51,
  },
  dayCard: {
    marginBottom: 18,
  },
  dayHeader: {
    alignItems: 'center',
    backgroundColor: '#E7F2F7',
    borderRadius: 11,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: 20,
  },
  dayToggle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 54,
  },
  dayTitle: {
    color: '#10161F',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 23,
  },
  dayDate: {
    color: '#8A9194',
    fontSize: 16,
    marginLeft: 12,
  },
  routeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 40,
    paddingLeft: 10,
  },
  routeButtonText: {
    color: '#56869D',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.45,
  },
  missionList: {
    gap: 22,
    marginLeft: 103,
    marginTop: 22,
  },
  missionRow: {
    backgroundColor: '#F6F6F6',
    borderRadius: 28,
    justifyContent: 'center',
    minHeight: 85,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  missionCopy: {
    flex: 1,
  },
  missionTitle: {
    color: '#10161F',
    fontSize: 17,
    fontWeight: '700',
  },
  missionLocation: {
    color: '#8A9194',
    fontSize: 15,
    marginTop: 5,
  },
});
