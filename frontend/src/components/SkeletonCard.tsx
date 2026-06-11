import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 40 - CARD_MARGIN * 2) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

function SkeletonCard() {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ]),
    ).start();
  }, [shimmer]);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.cardElevated, colors.separator],
  });

  return <Animated.View style={[styles.card, { backgroundColor }]} />;
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
