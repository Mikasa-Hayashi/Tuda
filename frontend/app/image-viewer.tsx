import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

/**
 * Full-screen photo viewer: the photo arrives with the iOS zoom transition from the cover it was
 * tapped on, then pinch-zooms and pans natively. Swipe down or the back button returns it.
 */
export default function ImageViewerScreen() {
  const { uri, width, height } = useLocalSearchParams<{
    uri?: string;
    width?: string;
    height?: string;
  }>();
  const win = useWindowDimensions();
  const router = useRouter();
  const { t } = useTranslation();

  // Fit the photo inside the window, keeping its aspect ratio (needed up front for the transition).
  const fitted = useMemo(() => {
    const w = parseInt(width ?? '', 10);
    const h = parseInt(height ?? '', 10);
    if (!w || !h) return { width: win.width, height: win.height };
    const k = Math.min(win.width / w, win.height / h);
    return { width: w * k, height: h * k };
  }, [width, height, win.width, win.height]);

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="xmark"
          accessibilityLabel={t('camera.close')}
          onPress={() => router.back()}
        />
      </Stack.Toolbar>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, { minHeight: win.height }]}
        maximumZoomScale={4}
        minimumZoomScale={1}
        centerContent
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bouncesZoom
      >
        <Link.AppleZoomTarget>
          <View style={fitted}>
            <Image
              source={uri ? { uri } : undefined}
              style={styles.image}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        </Link.AppleZoomTarget>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000000' },
  content: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
