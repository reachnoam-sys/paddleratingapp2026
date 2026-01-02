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

interface LookingForPartnerCardProps {
  player: Player;
  onInvite: (player: Player) => void;
  onChallengeToMatch?: (player: Player) => void;
  onCancelInvite?: (player: Player) => void;
  hasTeam?: boolean;
  isInvited?: boolean;
  index?: number;
}

export function LookingForPartnerCard({
  player,
  onInvite,
  onChallengeToMatch,
  onCancelInvite,
  hasTeam = false,
  isInvited = false,
  index = 0
}: LookingForPartnerCardProps) {
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
      style={styles.container}
    >
      <View style={styles.content}>
        <Image source={{ uri: player.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.elo}>{eloToDupr(player.elo)}</Text>
          <Text style={styles.status}>Looking for partner</Text>
        </View>
      </View>

      {hasTeam && (
        <Text style={styles.waitingStatus}>Waiting for 1 more player</Text>
      )}

      {isInvited ? (
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
      ) : (
        <AnimatedPressable
          style={[
            styles.partnerButton,
            hasTeam && styles.inviteButton,
            animatedButtonStyle
          ]}
          onPress={() => {
            if (hasTeam && onChallengeToMatch) {
              onChallengeToMatch(player);
            } else {
              onInvite(player);
            }
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[
            styles.partnerButtonText,
            hasTeam && styles.inviteButtonText
          ]}>
            {hasTeam ? 'Invite to play' : 'Partner up'}
          </Text>
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
    borderColor: colors.borderLight,
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
    fontSize: 24,
    lineHeight: 24,
    marginBottom: 4,
  },
  status: {
    color: colors.textMuted,
    fontSize: 14,
  },
  partnerButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  partnerButtonText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
  },
  inviteButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  inviteButtonText: {
    color: colors.black,
  },
  waitingButtonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waitingButton: {
    flex: 1,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  waitingButtonText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
  waitingStatus: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});
