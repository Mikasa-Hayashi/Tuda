import { Image as SymbolImage, Label } from '@expo/ui/swift-ui';
import { background, contentShape, frame, shapes } from '@expo/ui/swift-ui/modifiers';
import type { ComponentProps } from 'react';

type SymbolName = ComponentProps<typeof SymbolImage>['systemName'];

/**
 * Native SwiftUI label with a colored rounded-square badge and a white glyph, like the icons in
 * the system Settings app. Use inside SwiftUI `Form` rows.
 */
export function BadgeLabel({
  title,
  systemImage,
  color,
}: {
  title: string;
  systemImage: SymbolName;
  color: string;
}) {
  return (
    <Label
      title={title}
      // Whole row tappable when used inside a Button, not just the glyph and text.
      modifiers={[frame({ maxWidth: 10000, alignment: 'leading' }), contentShape(shapes.rectangle())]}
      icon={
        <SymbolImage
          systemName={systemImage}
          size={15}
          color="#FFFFFF"
          modifiers={[
            frame({ width: 28, height: 28 }),
            background(color, shapes.roundedRectangle({ cornerRadius: 7 })),
          ]}
        />
      }
    />
  );
}

/** Badge colors (iOS system palette). */
export const BADGE = {
  blue: '#007AFF',
  orange: '#FF9500',
  green: '#34C759',
  red: '#FF3B30',
  gray: '#8E8E93',
  indigo: '#5856D6',
} as const;
