import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { GameMode } from '../types';

interface GameModeToggleProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

export function GameModeToggle({ mode, onChange }: GameModeToggleProps) {
  const translateX = useSharedValue(mode === 'singles' ? 0 : 104);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(mode === 'singles' ? 0 : 104, {
          damping: 25,
          stiffness: 300,
        }),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />

      <Pressable style={styles.button} onPress={() => onChange('singles')}>
        <Text
          style={[
            styles.buttonText,
            mode === 'singles' ? styles.buttonTextActive : styles.buttonTextInactive,
          ]}
        >
          Singles
        </Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => onChange('doubles')}>
        <Text
          style={[
            styles.buttonText,
            mode === 'doubles' ? styles.buttonTextActive : styles.buttonTextInactive,
          ]}
        >
          Doubles
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.whiteSubtle,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 100,
    height: 36,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  button: {
    width: 100,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 14,
  },
  buttonTextActive: {
    color: colors.black,
  },
  buttonTextInactive: {
    color: colors.textSubtle,
  },
});
