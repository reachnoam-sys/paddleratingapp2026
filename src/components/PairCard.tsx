import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Search } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { eloToRating } from '../utils';
import type { Player } from '../types';

export type PairStatus = 'pending' | 'paired';

interface PairCardProps {
  player: Player;
  mode: 'doubles' | 'singles';
  status: PairStatus;
  onUnpair: () => void;
  onFindOpponents?: () => void;
  onSwitchToSingles?: () => void;
}

export function PairCard({
  player,
  mode,
  status,
  onUnpair,
  onFindOpponents,
  onSwitchToSingles,
}: PairCardProps) {
  const handleUnpair = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUnpair();
  };

  const handleFindOpponents = () => {
    if (onFindOpponents) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onFindOpponents();
    }
  };

  const handleSwitchToSingles = () => {
    if (onSwitchToSingles) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSwitchToSingles();
    }
  };

  const rating = eloToRating(player.elo);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {/* Header with status indicator */}
      <View style={styles.header}>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>PARTNERED</Text>
        </View>
        <Pressable
          style={styles.dismissButton}
          onPress={handleUnpair}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Partner info with larger avatar */}
      <View style={styles.partnerInfo}>
        <Image source={{ uri: player.avatar }} style={styles.avatar} />
        <View style={styles.partnerDetails}>
          <Text style={styles.partnerName}>{player.name}</Text>
          <Text style={styles.partnerRating}>{rating} Rating</Text>
        </View>
      </View>

      {/* Find Opponents button */}
      {status === 'paired' && onFindOpponents && (
        <Pressable
          style={({ pressed }) => [
            styles.findOpponentsButton,
            pressed && styles.findOpponentsButtonPressed,
          ]}
          onPress={handleFindOpponents}
        >
          <Search size={18} color={colors.black} />
          <Text style={styles.findOpponentsText}>Find Opponents</Text>
        </Pressable>
      )}

      {/* Subtle singles option */}
      {status === 'paired' && onSwitchToSingles && (
        <Pressable style={styles.singlesLink} onPress={handleSwitchToSingles}>
          <Text style={styles.singlesLinkText}>Play singles instead?</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.accent}25`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  statusText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dismissButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  partnerRating: {
    color: colors.textMuted,
    fontSize: 14,
  },
  findOpponentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  findOpponentsButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  findOpponentsText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  singlesLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  singlesLinkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
