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
    backgroundColor: '#E3F0F6',
    borderRadius: 8,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: 16,
  },
  dayToggle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 40,
  },
  dayTitle: {
    color: '#10161F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 23,
  },
  dayDate: {
    color: '#8A9194',
    fontSize: 12,
    fontWeight: '500',
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
    color: '#2F7F9A',
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    justifyContent: 'center',
    minHeight: 63,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  missionCopy: {
    flex: 1,
  },
  missionTitle: {
    color: '#10161F',
    fontSize: 14,
    fontWeight: '600',
  },
  missionLocation: {
    color: '#8A9194',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
});
