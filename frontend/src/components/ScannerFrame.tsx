import React from 'react';
import { StyleSheet, View } from 'react-native';

const DEFAULT_SIZE = 250;

/** Square scan frame. `size` is the side in points; the camera screen passes the preview width,
 *  which is exactly the square the ML service crops out of the photo. */
export const ScannerFrame: React.FC<{ size?: number }> = ({ size = DEFAULT_SIZE }) => (
  <View style={styles.container}>
    <View style={{ width: size, height: size }}>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: 'white', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
});
