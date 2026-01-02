import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

interface SessionLogPromptProps {
  visible: boolean;
  players: Player[];
  location: string;
  onLogScores: () => void;
  onSkip: () => void;
}

export function SessionLogPrompt({
  visible,
  players,
  location,
  onLogScores,
  onSkip,
}: SessionLogPromptProps) {
  if (!visible || players.length === 0) return null;

  const playerNames = players.map(p => p.name.split(' ')[0]).join(', ');
  const displayNames = players.length > 3
    ? `${players.slice(0, 2).map(p => p.name.split(' ')[0]).join(', ')} +${players.length - 2}`
    : playerNames;

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify().damping(18)}
      exiting={SlideOutDown.duration(300)}
      style={styles.container}
    >
      <Animated.View
        entering={FadeIn.delay(100).duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.card}
      >
        {/* Player Avatars */}
        <View style={styles.avatarsRow}>
          {players.slice(0, 4).map((player, idx) => (
            <Image
              key={player.id}
              source={{ uri: player.avatar }}
              style={[
                styles.avatar,
                idx > 0 && styles.avatarOverlap,
              ]}
            />
          ))}
          {players.length > 4 && (
            <View style={[styles.avatar, styles.avatarOverlap, styles.moreAvatar]}>
              <Text style={styles.moreAvatarText}>+{players.length - 4}</Text>
            </View>
          )}
        </View>

        {/* Message */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Session ended</Text>
          <Text style={styles.message}>
            Played with {displayNames} at {location}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>
          <Pressable style={styles.logButton} onPress={onLogScores}>
            <Text style={styles.logButtonText}>Log scores</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  moreAvatar: {
    backgroundColor: colors.whiteMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAvatarText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  textContent: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skipButton: {
    flex: 1,
    backgroundColor: colors.transparent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  logButton: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  logButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '600',
  },
});
