import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SIZE = 100;
const DURATION = 2000;
const COLOR = '#fff9f9';

function Circle({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Offset each circle's animation
    const t = (progress.value + delay) % 1;

    return {
      transform: [
        {
          scale: interpolate(t, [0, 1], [0, 1]),
        },
      ],
      opacity: interpolate(t, [0, 1], [1, 0]),
    };
  });

  return <Animated.View style={[styles.circle, animatedStyle]} />;
}

export default function Loading() {
  return (
    <View style={styles.container}>
      <Circle delay={0} />
      <Circle delay={0.25} />
      <Circle delay={0.5} />
      <Circle delay={0.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
  },

  circle: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: COLOR,
  },
});