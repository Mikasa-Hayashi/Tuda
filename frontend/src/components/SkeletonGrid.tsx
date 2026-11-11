import { HStack, Host, RoundedRectangle, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  preferredColorScheme,
  redacted,
} from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '@/src/theme/ThemeContext';
import React from 'react';

const ROWS = 3;
const GAP = 16;

/**
 * Loading placeholder for the monument grid, drawn natively: system placeholder fill for the
 * photos and SwiftUI's own redaction (`.redacted(reason: .placeholder)`) for the titles, so it
 * looks like iOS's built-in skeleton and follows light/dark automatically.
 */
export default function SkeletonGrid({
  cardWidth,
  columnGap,
}: {
  cardWidth: number;
  columnGap: number;
}) {
  const { isDark } = useTheme();
  const imageHeight = (cardWidth * 5) / 4;
  const rowHeight = imageHeight + 8 + 20;
  const fill = foregroundStyle({ type: 'hierarchical', style: 'quaternary' });

  const card = (key: string) => (
    <VStack key={key} alignment="leading" spacing={8} modifiers={[frame({ width: cardWidth })]}>
      <RoundedRectangle
        cornerRadius={14}
        modifiers={[frame({ width: cardWidth, height: imageHeight }), fill]}
      />
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), redacted('placeholder')]}>
        Placeholder title
      </Text>
    </VStack>
  );

  return (
    <Host
      style={{
        width: cardWidth * 2 + columnGap,
        height: ROWS * rowHeight + (ROWS - 1) * GAP,
        alignSelf: 'center',
      }}
      modifiers={[preferredColorScheme(isDark ? 'dark' : 'light')]}
    >
      <VStack spacing={GAP}>
        {Array.from({ length: ROWS }, (_, r) => (
          <HStack key={r} spacing={columnGap}>
            {card(`${r}-0`)}
            {card(`${r}-1`)}
          </HStack>
        ))}
      </VStack>
    </Host>
  );
}
