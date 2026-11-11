import CoverImage from '@/src/components/CoverImage';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Cover photo that opens full screen on tap. The photo zooms out of its own frame (iOS zoom
 * transition) and back, and its size is passed along so the viewer can fit it exactly.
 */
export default function PhotoLink({
  uri,
  style,
}: {
  uri: string | null | undefined;
  style: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const image = (
    <CoverImage
      source={uri ? { uri } : undefined}
      style={style}
      contentFit="cover"
      contentPosition={{ top: 0, left: '50%' }}
      cachePolicy="memory-disk"
      onLoad={(e) => setSize({ width: e.source.width, height: e.source.height })}
    />
  );
  if (!uri) return image;
  return (
    <Link
      href={{
        pathname: '/image-viewer',
        params: { uri, width: size?.width, height: size?.height },
      }}
      asChild
    >
      <Pressable>
        <Link.AppleZoom>{image}</Link.AppleZoom>
      </Pressable>
    </Link>
  );
}
