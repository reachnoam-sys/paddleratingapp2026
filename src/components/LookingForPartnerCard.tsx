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
  onPlayerTap: (player: Player) => void;
  onCancelInvite?: (player: Player) => void;
  onRequestNextGame?: (player: Player) => void;
  isInvited?: boolean;
  isNextGameRequested?: boolean;
  index?: number;
}

export function LookingForPartnerCard({
  player,
  onPlayerTap,
  onCancelInvite,
  onRequestNextGame,
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

  // Get status display config
  const getStatusConfig = () => {
    if (isOnCourt) {
      return { text: player.status, color: colors.textMuted, showDot: true };
    }
    if (isWaiting) {
      return { text: 'Waiting', color: '#D4A017', showDot: true };
    }
    return { text: 'Available', color: 'rgba(147, 112, 219, 0.9)', showDot: true };
  };

  const statusConfig = getStatusConfig();

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
              <Text style={styles.requestedButtonText}>Requested</Text>
            </AnimatedPressable>
            <Text style={styles.helperText}>They'll see it after the game</Text>
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
        <View style={styles.invitedButtonContainer}>
          <View style={styles.invitedButton}>
            <Text style={styles.invitedButtonText}>Waiting for response</Text>
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

    // Default - opens action sheet to choose partner up or singles
    return (
      <AnimatedPressable
        style={[styles.playButton, animatedButtonStyle]}
        onPress={() => onPlayerTap(player)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.playButtonText}>Play with {player.name.split(' ')[0]}</Text>
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
      <View style={styles.content}>
        {/* Left side: Avatar + Name + Status */}
        <Image source={{ uri: player.avatar }} style={styles.avatar} />
        <View style={styles.playerInfo}>
          <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Right side: Hero rating */}
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
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  containerOnCourt: {
    opacity: 0.55,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  playerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 17,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  heroRating: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 36,
    letterSpacing: -1,
    marginLeft: spacing.md,
  },
  playButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  playButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  requestNextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  requestNextButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  requestedButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  requestedButtonText: {
    color: 'rgba(57, 255, 20, 0.85)',
    fontWeight: '600',
    fontSize: 15,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  invitedButtonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  invitedButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  invitedButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 15,
  },
});
