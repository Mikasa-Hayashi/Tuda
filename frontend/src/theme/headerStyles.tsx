import { StyleSheet } from 'react-native'

export const headerStyles = StyleSheet.create({
  headerContainer: { zIndex: 10 },
  headerContent: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  //   headerTitleHighlight: { color: '#FFD700', },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});