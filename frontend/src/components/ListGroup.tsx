import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/theme/ThemeContext';

const BADGE = 28;
const H_PAD = 18;
const ICON_GAP = 14;

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
  const [pressed, setPressed] = React.useState<number | null>(null);
  return (
    <View style={[styles.group, { backgroundColor: colors.card }, style]}>
      {rows.map((row, i) =>
        React.isValidElement<RowInjected>(row)
          ? React.cloneElement(row, {
              isLast: i === rows.length - 1,
              // iOS hides the separators around a highlighted row
              hideSeparator: pressed === i || pressed === i + 1,
              onPressChange: (isPressed: boolean) => setPressed(isPressed ? i : null),
            })
          : row,
      )}
    </View>
  );
}

type RowInjected = {
  isLast?: boolean;
  hideSeparator?: boolean;
  onPressChange?: (pressed: boolean) => void;
};

/** Standalone separator between custom (non-ListRow) content inside a ListGroup. */
export function ListDivider({
  inset = H_PAD,
  hideSeparator,
}: RowInjected & { inset?: number }) {
  const { colors } = useTheme();
  if (hideSeparator) return <View style={{ height: StyleSheet.hairlineWidth }} />;
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        marginLeft: inset,
        marginRight: 20,
        backgroundColor: colors.separator,
      }}
    />
  );
}

type RowProps = RowInjected & {
  title: string;
  /** Colored rounded-square badge with a white glyph, like iOS Settings. */
  icon?: { sf: SFSymbol; fallback: IconName; color: string };
  onPress?: () => void;
  chevron?: boolean;
  /** Render the title in the accent color (e.g. "Sign in"). */
  accent?: boolean;
};

export function ListRow({
  title,
  icon,
  onPress,
  chevron = !!onPress,
  accent,
  isLast,
  hideSeparator,
  onPressChange,
}: RowProps) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      onPressIn={() => onPressChange?.(true)}
      onPressOut={() => onPressChange?.(false)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]}
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
      {!isLast && !hideSeparator && (
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
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: H_PAD,
    paddingRight: H_PAD,
    paddingVertical: 8,
    gap: ICON_GAP,
  },
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
    right: 20,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
