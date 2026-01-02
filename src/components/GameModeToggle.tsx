import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { GameMode } from '../types';

interface GameModeToggleProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

const BUTTON_WIDTH = 110;

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GameModeToggle({ mode, onChange }: GameModeToggleProps) {
  const progress = useSharedValue(mode === 'singles' ? 0 : 1);
  const singlesScale = useSharedValue(mode === 'singles' ? 1 : 0.95);
  const doublesScale = useSharedValue(mode === 'doubles' ? 1 : 0.95);
  const indicatorScale = useSharedValue(1);

  useEffect(() => {
    // Premium spring configuration
    const springConfig = {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    };

    progress.value = withSpring(mode === 'singles' ? 0 : 1, springConfig);

    // Scale animations for text labels
    singlesScale.value = withSpring(mode === 'singles' ? 1 : 0.92, {
      damping: 15,
      stiffness: 200,
    });
    doublesScale.value = withSpring(mode === 'doubles' ? 1 : 0.92, {
      damping: 15,
      stiffness: 200,
    });

    // Subtle indicator pulse on change
    indicatorScale.value = withTiming(1.02, {
      duration: 100,
      easing: Easing.out(Easing.cubic),
    }, () => {
      indicatorScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
  }, [mode]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [0, BUTTON_WIDTH]),
      },
      {
        scale: indicatorScale.value,
      },
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0.85, 1]),
  }));

  const singlesTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: singlesScale.value }],
    opacity: interpolate(progress.value, [0, 1], [1, 0.6]),
  }));

  const doublesTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doublesScale.value }],
    opacity: interpolate(progress.value, [0, 1], [0.6, 1]),
  }));

  const handlePress = (newMode: GameMode) => {
    if (newMode !== mode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newMode);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />

      <AnimatedPressable style={styles.button} onPress={() => handlePress('singles')}>
        <AnimatedText
          style={[
            styles.buttonText,
            mode === 'singles' ? styles.buttonTextActive : styles.buttonTextInactive,
            singlesTextStyle,
          ]}
        >
          Singles
        </AnimatedText>
      </AnimatedPressable>

      <AnimatedPressable style={styles.button} onPress={() => handlePress('doubles')}>
        <AnimatedText
          style={[
            styles.buttonText,
            mode === 'doubles' ? styles.buttonTextActive : styles.buttonTextInactive,
            doublesTextStyle,
          ]}
        >
          Doubles
        </AnimatedText>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xl,
    padding: 5,
  },
  indicator: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: BUTTON_WIDTH,
    height: 40,
    backgroundColor: 'rgba(57, 255, 20, 0.85)',
    borderRadius: borderRadius.lg,
  },
  button: {
    width: BUTTON_WIDTH,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  buttonTextActive: {
    color: colors.black,
  },
  buttonTextInactive: {
    color: colors.textMuted,
  },
});
