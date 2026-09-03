import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
  },
  headerBackButton: {
    alignItems: 'flex-start',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  headerTitle: {
    color: '#10161F',
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  intro: {
    marginTop: 28,
  },
  tripName: {
    color: '#10161F',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  introDescription: {
    color: '#8A9194',
    fontSize: 15,
    marginTop: 4,
  },
  permissionHint: {
    color: '#8A9194',
    fontSize: 12,
    marginTop: 18,
    textAlign: 'center',
  },
  resultMessage: {
    color: '#409CB7',
    fontSize: 12,
    fontWeight: '700',
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
