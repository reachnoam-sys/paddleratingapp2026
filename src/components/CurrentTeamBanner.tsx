import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { CurrentUser, CurrentTeam } from '../types';
import { eloToRating } from '../utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CurrentTeamBannerProps {
  currentUser: CurrentUser;
  currentTeam: CurrentTeam;
  onLeaveTeam: () => void;
}

export function CurrentTeamBanner({
  currentUser,
  currentTeam,
  onLeaveTeam,
}: CurrentTeamBannerProps) {
  const scale = useSharedValue(1);
  const averageElo = Math.round(currentTeam.combinedElo / 2);
  const averageRating = eloToRating(averageElo);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={styles.container}
    >
      <View style={styles.avatarsContainer}>
        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
        <Image
          source={{ uri: currentTeam.partner.avatar }}
          style={[styles.avatar, styles.avatarSecond]}
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.teamLabel}>Your Team</Text>
        <Text style={styles.combinedElo}>{averageRating}</Text>
        <Text style={styles.partnerNames}>
          {currentUser.name} & {currentTeam.partner.name}
        </Text>
      </View>

      <AnimatedPressable
        style={[styles.leaveButton, animatedButtonStyle]}
        onPress={onLeaveTeam}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Leave team"
        accessibilityRole="button"
      >
        <Text style={styles.leaveButtonText}>Leave</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarsContainer: {
    flexDirection: 'row',
    marginRight: spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarSecond: {
    marginLeft: -16,
  },
  infoSection: {
    flex: 1,
  },
  teamLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  combinedElo: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: -0.48,
  },
  partnerNames: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  leaveButton: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.destructive,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  leaveButtonText: {
    color: colors.destructive,
    fontWeight: '500',
    fontSize: 14,
  },
});
