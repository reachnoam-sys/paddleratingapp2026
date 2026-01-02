import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function eloToDupr(elo: number): string {
  const dupr = 2.0 + ((elo - 1000) / 500) * 2.0;
  return Math.max(2.0, Math.min(6.0, dupr)).toFixed(1);
}

interface PlayerCardProps {
  player: Player;
  onChallenge: (player: Player) => void;
  index?: number;
}

export function PlayerCard({ player, onChallenge, index = 0 }: PlayerCardProps) {
  const isReady = player.status === 'Waiting' || player.status === 'Ready';
  const isPlaying = player.status.startsWith('On Court');

  const scale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={[
        styles.container,
        isReady ? styles.containerReady : styles.containerDefault,
        isPlaying && styles.containerPlaying,
      ]}
    >
      {isPlaying && (
        <Text style={styles.statusText}>{player.status}</Text>
      )}

      <View style={styles.content}>
        <Image source={{ uri: player.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.elo}>{eloToDupr(player.elo)}</Text>
        </View>
      </View>

      {isReady && (
        <AnimatedPressable
          style={[styles.challengeButton, animatedButtonStyle]}
          onPress={() => onChallenge(player)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.challengeButtonText}>Challenge</Text>
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  containerReady: {
    borderColor: colors.borderAccent,
  },
  containerDefault: {
    borderColor: colors.borderLight,
  },
  containerPlaying: {
    opacity: 0.5,
  },
  statusText: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    color: colors.textMuted,
    fontSize: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 4,
  },
  elo: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
  },
  challengeButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  challengeButtonText: {
    color: colors.black,
    fontWeight: '500',
    fontSize: 16,
  },
});
