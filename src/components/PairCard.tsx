import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { eloToRating } from '../utils';
import type { Player } from '../types';

export type PairStatus = 'pending' | 'paired';

interface PairCardProps {
  player: Player;
  mode: 'doubles' | 'singles';
  status: PairStatus;
  onUnpair: () => void;
  onSwitchToSingles?: () => void;
}

export function PairCard({
  player,
  mode,
  status,
  onUnpair,
  onSwitchToSingles,
}: PairCardProps) {
  const handleUnpair = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUnpair();
  };

  const handleSwitchToSingles = () => {
    if (onSwitchToSingles) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSwitchToSingles();
    }
  };

  const rating = eloToRating(player.elo);
  const firstName = player.name.split(' ')[0];

  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.container}>
      {/* Inline text row */}
      <Text style={styles.pairText}>
        Paired with{' '}
        <Text style={styles.playerName}>{firstName}</Text>
        <Text style={styles.rating}> ({rating})</Text>
      </Text>

      {/* Compact action buttons */}
      <View style={styles.actions}>
        {mode === 'doubles' && status === 'paired' && onSwitchToSingles && (
          <Pressable style={styles.actionButton} onPress={handleSwitchToSingles}>
            <Text style={styles.actionText}>Singles</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionButton} onPress={handleUnpair}>
          <X size={12} color={colors.textMuted} />
          <Text style={styles.actionText}>Unpair</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.lg,
  },
  pairText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  playerName: {
    color: colors.white,
    fontWeight: '600',
  },
  rating: {
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.md,
  },
  actionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
