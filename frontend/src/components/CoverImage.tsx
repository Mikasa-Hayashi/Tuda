import { Image, type ImageProps } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Photo with rounded corners. The rounding and clipping live on a wrapping View, so all four
 * corners are cut the same way (a borderRadius on the image itself rounded the bottom corners
 * but left the top ones looking squared off). Photos fade in over the placeholder colour once
 * loaded. Pass size, aspectRatio and borderRadius in `style`.
 */
export default function CoverImage({
  style,
  ...imageProps
}: Omit<ImageProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.clip, style]}>
      <Image transition={200} {...imageProps} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', borderCurve: 'continuous' },
});
