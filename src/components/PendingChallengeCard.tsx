import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Team } from '../types';
import { eloToRating } from '../utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatRating(elo: number | undefined): string {
  if (elo === undefined) return '-';
  return eloToRating(elo);
}

interface PendingChallengeCardProps {
  acceptedTeam: Team;
  onCancelChallenge: () => void;
}

export function PendingChallengeCard({
  acceptedTeam,
  onCancelChallenge,
}: PendingChallengeCardProps) {
  const averageElo = Math.round(acceptedTeam.combinedElo / 2);
  const averageRating = formatRating(averageElo);

  const cancelScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedCancelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleCancelPressIn = () => {
    cancelScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handleCancelPressOut = () => {
    cancelScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={styles.container}
    >
      <View style={styles.headerSection}>
        <View style={styles.checkIcon}>
          <Text style={styles.checkText}>✓</Text>
        </View>
        <Text style={styles.headerText}>CHALLENGE ACCEPTED</Text>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.teamAverageLabel}>Team Average</Text>
        <Text style={styles.heroElo}>{averageRating}</Text>
      </View>

      <View style={styles.teamNameSection}>
        <Text style={styles.teamName}>{acceptedTeam.name}</Text>
      </View>

      <View style={styles.playersGrid}>
        <View style={styles.playerColumn}>
          <Image
            source={{ uri: acceptedTeam.player1.avatar }}
            style={styles.playerAvatar}
          />
          <Text style={styles.playerName}>{acceptedTeam.player1.name}</Text>
          <Text style={styles.playerElo}>{formatRating(acceptedTeam.player1.elo)}</Text>
        </View>

        <View style={styles.playerColumn}>
          <Image
            source={{ uri: acceptedTeam.player2.avatar }}
            style={styles.playerAvatar}
          />
          <Text style={styles.playerName}>{acceptedTeam.player2.name}</Text>
          <Text style={styles.playerElo}>{formatRating(acceptedTeam.player2.elo)}</Text>
        </View>
      </View>

      <Animated.Text style={[styles.ctaText, animatedPulseStyle]}>
        Find a partner to start the match
      </Animated.Text>

      <AnimatedPressable
        style={[styles.cancelButton, animatedCancelStyle]}
        onPress={onCancelChallenge}
        onPressIn={handleCancelPressIn}
        onPressOut={handleCancelPressOut}
      >
        <Text style={styles.cancelButtonText}>Cancel Challenge</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '700',
  },
  headerText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  teamAverageLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  heroElo: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.12,
  },
  teamNameSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  teamName: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 16,
  },
  playersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  playerColumn: {
    alignItems: 'center',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  playerName: {
    color: 'rgba(255, 255, 255, 0.80)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  playerElo: {
    color: 'rgba(255, 255, 255, 0.30)',
    fontSize: 12,
  },
  ctaText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  cancelButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 16,
  },
});
