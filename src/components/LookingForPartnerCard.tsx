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

interface LookingForPartnerCardProps {
  player: Player;
  onInvite: (player: Player) => void;
  onChallengeToMatch?: (player: Player) => void;
  onCancelInvite?: (player: Player) => void;
  onRequestNextGame?: (player: Player) => void;
  hasTeam?: boolean;
  isInvited?: boolean;
  isNextGameRequested?: boolean;
  index?: number;
}

export function LookingForPartnerCard({
  player,
  onInvite,
  onChallengeToMatch,
  onCancelInvite,
  onRequestNextGame,
  hasTeam = false,
  isInvited = false,
  isNextGameRequested = false,
  index = 0
}: LookingForPartnerCardProps) {
  const scale = useSharedValue(1);

  const isOnCourt = player.status.startsWith('On Court');
  const isWaiting = player.status === 'Waiting';

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  // Get status display info - for solo players
  const getStatusInfo = () => {
    if (isOnCourt) {
      return { text: player.status, color: colors.textMuted };
    }
    if (isWaiting) {
      return { text: 'In queue', color: 'rgba(255, 193, 7, 0.8)' };
    }
    // Default status for solo players seeking a partner
    return { text: 'Open to partner', color: 'rgba(147, 112, 219, 0.8)' };
  };

  const statusInfo = getStatusInfo();

  // Render the appropriate CTA button
  const renderCTA = () => {
    // On Court players - show Request Next Game
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

    // Invited state
    if (isInvited) {
      return (
        <View style={styles.waitingButtonContainer}>
          <View style={styles.waitingButton}>
            <Text style={styles.waitingButtonText}>Waiting for response</Text>
          </View>
          {onCancelInvite && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => onCancelInvite(player)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      );
    }

    // Has team - show invite to play (challenge)
    if (hasTeam) {
      return (
        <AnimatedPressable
          style={[styles.challengeButton, animatedButtonStyle]}
          onPress={() => onChallengeToMatch?.(player)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.challengeButtonText}>Invite to play</Text>
        </AnimatedPressable>
      );
    }

    // Default - Partner up
    return (
      <AnimatedPressable
        style={[styles.partnerButton, animatedButtonStyle]}
        onPress={() => onInvite(player)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.partnerButtonText}>Partner up</Text>
      </AnimatedPressable>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={[
        styles.container,
        isOnCourt && styles.containerOnCourt,
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

      {hasTeam && !isOnCourt && !isInvited && (
        <Text style={styles.waitingStatus}>Needs 1 more to start</Text>
      )}

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
  containerOnCourt: {
    opacity: 0.6,
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
  partnerButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  partnerButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 15,
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
  waitingButtonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waitingButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  waitingButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 15,
  },
  waitingStatus: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});
