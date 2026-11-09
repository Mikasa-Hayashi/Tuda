import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/theme/ThemeContext';

const BADGE = 29;
const H_PAD = 16;
const ICON_GAP = 12;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** SF SymbolIcon on iOS, Ionicons fallback elsewhere. */
export function SymbolIcon({
  sf,
  fallback,
  size,
  color,
  weight,
}: {
  sf: SFSymbol;
  fallback: IconName;
  size: number;
  color: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  return (
    <SymbolView
      name={sf}
      size={size}
      tintColor={color}
      weight={weight}
      style={{ width: size, height: size }}
      fallback={<Ionicons name={fallback} size={size} color={color} />}
    />
  );
}

/** iOS "inset grouped" container: rounded card on the grouped background. */
export function ListGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, { backgroundColor: colors.card }, style]}>
      {rows.map((row, i) =>
        React.isValidElement<{ isLast?: boolean }>(row)
          ? React.cloneElement(row, { isLast: i === rows.length - 1 })
          : row,
      )}
    </View>
  );
}

type RowProps = {
  title: string;
  /** Colored rounded-square badge with a white glyph, like iOS Settings. */
  icon?: { sf: SFSymbol; fallback: IconName; color: string };
  onPress?: () => void;
  chevron?: boolean;
  /** Render the title in the accent color (e.g. "Sign in"). */
  accent?: boolean;
  isLast?: boolean;
};

export function ListRow({ title, icon, onPress, chevron = !!onPress, accent, isLast }: RowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon && (
        <View style={[styles.badge, { backgroundColor: icon.color }]}>
          <SymbolIcon sf={icon.sf} fallback={icon.fallback} size={17} color="#FFFFFF" />
        </View>
      )}
      <Text
        style={[styles.title, { color: accent ? colors.primary : colors.text }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {chevron && (
        <SymbolIcon
          sf="chevron.right"
          fallback="chevron-forward"
          size={14}
          color={colors.textMuted}
          weight="semibold"
        />
      )}
      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.separator, left: icon ? H_PAD + BADGE + ICON_GAP : H_PAD },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: H_PAD,
    paddingRight: 14,
    paddingVertical: 7,
    gap: ICON_GAP,
  },
  pressed: { backgroundColor: 'rgba(128,128,128,0.18)' },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 17 },
  separator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
