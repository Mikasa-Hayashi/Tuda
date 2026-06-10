import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';

type RouteRowProps = {
  coverImageUrl: string;
  title: string;
  onPress: () => void;
};

export function RouteRow({ coverImageUrl, title, onPress }: RouteRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: coverImageUrl }} style={styles.image} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    minHeight: 88,
  },
  image: { width: 100, height: 88 },
  textWrap: { flex: 1, paddingHorizontal: 14, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
});
