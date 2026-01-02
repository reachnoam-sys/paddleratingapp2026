import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

interface MatchReadyBannerProps {
  visible: boolean;
  teams: {
    teamA: Player[];
    teamB: Player[];
  };
  onConfirmOnCourt: () => void;
  onDismiss: () => void;
}

export function MatchReadyBanner({
  visible,
  teams,
  onConfirmOnCourt,
  onDismiss,
}: MatchReadyBannerProps) {
  if (!visible) return null;

  const teamANames = teams.teamA.map(p => p.name.split(' ')[0]).join(' + ');
  const teamBNames = teams.teamB.map(p => p.name.split(' ')[0]).join(' + ');

  return (
    <Animated.View
      entering={SlideInUp.duration(400).springify().damping(15)}
      exiting={SlideOutUp.duration(300)}
      style={styles.container}
    >
      <Animated.View
        entering={FadeIn.delay(100).duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.content}
      >
        <Pressable style={styles.dismissButton} onPress={onDismiss}>
          <X size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Match ready</Text>
          <Text style={styles.subtitle}>
            {teamANames} vs {teamBNames}
          </Text>
          <Text style={styles.hint}>Tap when you step on court</Text>
        </View>

        <Pressable style={styles.ctaButton} onPress={onConfirmOnCourt}>
          <Text style={styles.ctaButtonText}>On court</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dismissButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 4,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  ctaButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  ctaButtonText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 14,
  },
});
