import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

interface TeamCardProps {
  team: Team;
  onChallenge: (team: Team) => void;
  isChallenged?: boolean;
  isAcceptedByMe?: boolean;
  isCooldown?: boolean;
  index?: number;
}

export function TeamCard({
  team,
  onChallenge,
  isChallenged = false,
  isAcceptedByMe = false,
  isCooldown = false,
  index = 0,
}: TeamCardProps) {
  const isReady = team.status === 'Waiting' || team.status === 'Ready';
  const isPlaying = team.status.startsWith('On Court');
  const averageElo = Math.round(team.combinedElo / 2);
  const averageRating = formatRating(averageElo);

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
        <Text style={styles.statusText}>{team.status}</Text>
      )}

      <View style={styles.heroSection}>
        <Text style={styles.teamAverageLabel}>Team Average</Text>
        <Text style={styles.heroElo}>{averageRating}</Text>
      </View>

      <View style={styles.teamNameSection}>
        <Text style={styles.teamName}>{team.name}</Text>
      </View>

      <View style={styles.playersGrid}>
        <View style={styles.playerColumn}>
          <Image source={{ uri: team.player1.avatar }} style={styles.playerAvatar} />
          <Text style={styles.playerName}>{team.player1.name}</Text>
          <Text style={styles.playerElo}>{formatRating(team.player1.elo)}</Text>
        </View>

        <View style={styles.playerColumn}>
          <Image source={{ uri: team.player2.avatar }} style={styles.playerAvatar} />
          <Text style={styles.playerName}>{team.player2.name}</Text>
          <Text style={styles.playerElo}>{formatRating(team.player2.elo)}</Text>
        </View>
      </View>

      {isReady && !isChallenged && !isAcceptedByMe && !isCooldown && (
        <AnimatedPressable
          style={[styles.challengeButton, animatedButtonStyle]}
          onPress={() => onChallenge(team)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.challengeButtonText}>Challenge</Text>
        </AnimatedPressable>
      )}
      {isChallenged && (
        <View style={styles.challengeSentButton}>
          <Text style={styles.challengeSentText}>Challenge sent</Text>
        </View>
      )}
      {isAcceptedByMe && (
        <View style={styles.awaitingPartnerButton}>
          <Text style={styles.awaitingPartnerText}>Awaiting your partner</Text>
        </View>
      )}
      {isCooldown && !isAcceptedByMe && !isChallenged && (
        <View style={styles.cooldownButton}>
          <Text style={styles.cooldownText}>Recently cancelled</Text>
        </View>
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
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
  challengeSentButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  challengeSentText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 16,
  },
  awaitingPartnerButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.20)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  awaitingPartnerText: {
    color: 'rgba(57, 255, 20, 0.60)',
    fontWeight: '500',
    fontSize: 16,
  },
  cooldownButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cooldownText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 16,
  },
});
