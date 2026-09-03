import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  intro: {
    marginTop: 28,
  },
  tripName: {
    color: '#10161F',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  introDescription: {
    color: '#8A9194',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  permissionHint: {
    color: '#8A9194',
    fontSize: 12,
    marginTop: 18,
    textAlign: 'center',
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: 20,
  },
  stateText: {
    color: '#6F7E84',
    fontSize: 13,
    textAlign: 'center',
  },
});
