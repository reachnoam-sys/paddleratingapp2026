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
import { eloToRating } from '../utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlayerCardProps {
  player: Player;
  onChallenge: (player: Player) => void;
  onRequestNextGame?: (player: Player) => void;
  isChallenged?: boolean;
  isAcceptedByMe?: boolean;
  isCooldown?: boolean;
  isNextGameRequested?: boolean;
  isCurrentUser?: boolean; // Highlight current user's card
  index?: number;
}

export function PlayerCard({
  player,
  onChallenge,
  onRequestNextGame,
  isChallenged = false,
  isAcceptedByMe = false,
  isCooldown = false,
  isNextGameRequested = false,
  isCurrentUser = false,
  index = 0,
}: PlayerCardProps) {
  const isReady = player.status === 'Ready';
  const isWaiting = player.status === 'Waiting';
  const isOnCourt = player.status.startsWith('On Court');
  const canChallenge = (isReady || isWaiting) && !isOnCourt;

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

  // Get status display info
  const getStatusInfo = () => {
    if (isOnCourt) {
      return { text: player.status, color: colors.textMuted };
    }
    if (isWaiting) {
      return { text: 'Waiting', color: 'rgba(255, 193, 7, 0.8)' };
    }
    if (isReady) {
      return { text: 'Ready', color: 'rgba(57, 255, 20, 0.7)' };
    }
    return { text: player.status, color: colors.textMuted };
  };

  const statusInfo = getStatusInfo();

  // Render the appropriate CTA button
  const renderCTA = () => {
    if (isChallenged) {
      return (
        <View style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Invite sent</Text>
        </View>
      );
    }

    if (isAcceptedByMe) {
      return (
        <View style={styles.acceptedButton}>
          <Text style={styles.acceptedText}>Accepted</Text>
        </View>
      );
    }

    if (isCooldown) {
      return (
        <View style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Recently cancelled</Text>
        </View>
      );
    }

    if (isOnCourt) {
      if (isNextGameRequested) {
        return (
          <View>
            <AnimatedPressable
              style={[styles.requestedButton, animatedButtonStyle]}
              onPress={() => onRequestNextGame?.(player)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={styles.requestedButtonText}>Requested ✓</Text>
            </AnimatedPressable>
            <Text style={styles.helperText}>They'll see it after the game.</Text>
          </View>
        );
      }
      return (
        <AnimatedPressable
          style={[styles.requestNextButton, animatedButtonStyle]}
          onPress={() => onRequestNextGame?.(player)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.requestNextButtonText}>Request Next Game</Text>
        </AnimatedPressable>
      );
    }

    if (canChallenge) {
      return (
        <AnimatedPressable
          style={[styles.challengeButton, animatedButtonStyle]}
          onPress={() => onChallenge(player)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.challengeButtonText}>Play</Text>
        </AnimatedPressable>
      );
    }

    return null;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={[
        styles.container,
        isCurrentUser && styles.containerCurrentUser,
      ]}
    >
      {/* Status badge - top right */}
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>

      <View style={styles.content}>
        <Image source={{ uri: player.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{player.name}</Text>
          {isWaiting && (
            <View style={styles.waitingTag}>
              <Text style={styles.waitingTagText}>Waiting</Text>
            </View>
          )}
        </View>
        {/* Hero rating */}
        <Text style={styles.heroRating}>{eloToRating(player.elo)}</Text>
      </View>

      {renderCTA()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
  },
  containerCurrentUser: {
    borderColor: 'rgba(57, 255, 20, 0.3)',
    borderWidth: 1,
    shadowColor: 'rgba(57, 255, 20, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
  },
  waitingTag: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  waitingTagText: {
    color: 'rgba(255, 193, 7, 0.9)',
    fontSize: 11,
    fontWeight: '500',
  },
  heroRating: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  challengeButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  challengeButtonText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 15,
  },
  acceptedButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.10)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  acceptedText: {
    color: 'rgba(57, 255, 20, 0.7)',
    fontWeight: '500',
    fontSize: 15,
  },
  unavailableButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  unavailableText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 15,
  },
  requestNextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  requestNextButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 15,
  },
  requestedButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.10)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  requestedButtonText: {
    color: 'rgba(57, 255, 20, 0.7)',
    fontWeight: '500',
    fontSize: 15,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
