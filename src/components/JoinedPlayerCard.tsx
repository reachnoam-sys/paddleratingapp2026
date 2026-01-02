import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

function eloToDupr(elo: number): string {
  const dupr = 2.0 + ((elo - 1000) / 500) * 2.0;
  return Math.max(2.0, Math.min(6.0, dupr)).toFixed(1);
}

interface JoinedPlayerCardProps {
  player: Player;
  status: 'invited' | 'accepted';
  onCancelInvite?: (player: Player) => void;
  index?: number;
}

export function JoinedPlayerCard({ player, status, onCancelInvite, index = 0 }: JoinedPlayerCardProps) {
  const isInvited = status === 'invited';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={[styles.container, isInvited && styles.containerInvited]}
    >
      <View style={styles.content}>
        <Image source={{ uri: player.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.elo}>{eloToDupr(player.elo)}</Text>
          <Text style={[styles.status, isInvited && styles.statusInvited]}>
            {isInvited ? 'Invite sent' : 'Joined game'}
          </Text>
        </View>
        {isInvited && onCancelInvite && (
          <Pressable
            style={styles.cancelButton}
            onPress={() => onCancelInvite(player)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
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
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  statusInvited: {
    color: colors.textMuted,
  },
  containerInvited: {
    borderColor: colors.borderMedium,
  },
  cancelButton: {
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
});
