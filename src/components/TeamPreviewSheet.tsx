import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Swords, X, TrendingUp, Trophy, Target } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { eloToRating } from '../utils';
import type { Player } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TeamPreviewSheetProps {
  visible: boolean;
  user: Player | null;
  partner: Player | null;
  onClose: () => void;
  onPlaySingles: () => void;
  onLeaveTeam: () => void;
  teamStats?: {
    wins: number;
    losses: number;
    streak: number;
  };
}

// Ultra-premium spring configs
const springConfig = {
  damping: 26,
  stiffness: 320,
  mass: 0.75,
};

const cardSpring = {
  damping: 22,
  stiffness: 280,
  mass: 0.8,
};

export function TeamPreviewSheet({
  visible,
  user,
  partner,
  onClose,
  onPlaySingles,
  onLeaveTeam,
  teamStats = { wins: 0, losses: 0, streak: 0 },
}: TeamPreviewSheetProps) {
  const translateY = useSharedValue(500);
  const opacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.8);
  const userAvatarRotate = useSharedValue(-15);
  const partnerAvatarRotate = useSharedValue(15);
  const statsScale = useSharedValue(0.9);
  const statsOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.95);
  const buttonOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && user && partner) {
      // Orchestrated entrance animation
      translateY.value = withSpring(0, springConfig);
      opacity.value = withTiming(1, { duration: 250 });

      // Avatar entrance with playful rotation
      avatarScale.value = withDelay(100, withSpring(1, cardSpring));
      userAvatarRotate.value = withDelay(100, withSpring(0, { damping: 12, stiffness: 200 }));
      partnerAvatarRotate.value = withDelay(150, withSpring(0, { damping: 12, stiffness: 200 }));

      // Stats fade in
      statsScale.value = withDelay(200, withSpring(1, cardSpring));
      statsOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));

      // Button entrance
      buttonScale.value = withDelay(300, withSpring(1, cardSpring));
      buttonOpacity.value = withDelay(300, withTiming(1, { duration: 250 }));

      // Subtle glow pulse
      glowOpacity.value = withDelay(400, withSequence(
        withTiming(0.6, { duration: 400 }),
        withTiming(0.3, { duration: 600 })
      ));
    } else {
      translateY.value = withTiming(500, { duration: 200, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 200 });
      avatarScale.value = 0.8;
      userAvatarRotate.value = -15;
      partnerAvatarRotate.value = 15;
      statsScale.value = 0.9;
      statsOpacity.value = 0;
      buttonScale.value = 0.95;
      buttonOpacity.value = 0;
      glowOpacity.value = 0;
    }
  }, [visible, user, partner]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const avatarContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const userAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${userAvatarRotate.value}deg` }],
  }));

  const partnerAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${partnerAvatarRotate.value}deg` }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statsScale.value }],
    opacity: statsOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePlaySingles = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlaySingles();
  };

  const handleLeaveTeam = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLeaveTeam();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Swipe down to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(500, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
        opacity.value = withTiming(0, { duration: 200 });
      } else {
        translateY.value = withSpring(0, springConfig);
      }
    });

  if (!visible || !user || !partner) return null;

  const userRating = eloToRating(user.elo);
  const partnerRating = eloToRating(partner.elo);
  const avgRating = ((parseFloat(userRating) + parseFloat(partnerRating)) / 2).toFixed(1);
  const winRate = teamStats.wins + teamStats.losses > 0
    ? Math.round((teamStats.wins / (teamStats.wins + teamStats.losses)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Glow effect behind avatars */}
          <Animated.View style={[styles.glowEffect, glowStyle]} />

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
            <X size={20} color={colors.textMuted} />
          </Pressable>

          {/* Team Avatars - Overlapping with style */}
          <Animated.View style={[styles.avatarsContainer, avatarContainerStyle]}>
            <Animated.View style={[styles.avatarWrapper, styles.userAvatarWrapper, userAvatarStyle]}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={styles.avatarGlow} />
            </Animated.View>
            <Animated.View style={[styles.avatarWrapper, styles.partnerAvatarWrapper, partnerAvatarStyle]}>
              <Image source={{ uri: partner.avatar }} style={styles.avatar} />
              <View style={styles.avatarGlow} />
            </Animated.View>
          </Animated.View>

          {/* Team label */}
          <View style={styles.teamLabel}>
            <View style={styles.teamDot} />
            <Text style={styles.teamLabelText}>YOUR TEAM</Text>
          </View>

          {/* Names */}
          <Text style={styles.teamNames}>
            {user.name.split(' ')[0]} & {partner.name.split(' ')[0]}
          </Text>

          {/* Combined Rating */}
          <View style={styles.ratingBadge}>
            <Text style={styles.avgRating}>{avgRating}</Text>
            <Text style={styles.avgRatingLabel}>avg rating</Text>
          </View>

          {/* Stats Row */}
          <Animated.View style={[styles.statsRow, statsStyle]}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Trophy size={16} color={colors.accent} />
              </View>
              <Text style={styles.statValue}>{teamStats.wins}-{teamStats.losses}</Text>
              <Text style={styles.statLabel}>Record</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Target size={16} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{teamStats.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </Animated.View>

          {/* Individual ratings */}
          <Animated.View style={[styles.individualRatings, statsStyle]}>
            <View style={styles.individualItem}>
              <Image source={{ uri: user.avatar }} style={styles.miniAvatar} />
              <Text style={styles.individualName}>You</Text>
              <Text style={styles.individualRating}>{userRating}</Text>
            </View>
            <View style={styles.individualDivider} />
            <View style={styles.individualItem}>
              <Image source={{ uri: partner.avatar }} style={styles.miniAvatar} />
              <Text style={styles.individualName}>{partner.name.split(' ')[0]}</Text>
              <Text style={styles.individualRating}>{partnerRating}</Text>
            </View>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View style={[styles.actionsContainer, buttonStyle]}>
            <Pressable
              style={({ pressed }) => [
                styles.singlesButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handlePlaySingles}
            >
              <Swords size={20} color="#F59E0B" />
              <Text style={styles.singlesButtonText}>Play Singles vs {partner.name.split(' ')[0]}</Text>
            </Pressable>

            <Pressable style={styles.leaveButton} onPress={handleLeaveTeam}>
              <Text style={styles.leaveButtonText}>Leave Team</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: 40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.15,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.sm,
    zIndex: 10,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    height: 100,
  },
  avatarWrapper: {
    position: 'relative',
  },
  userAvatarWrapper: {
    zIndex: 2,
  },
  partnerAvatarWrapper: {
    marginLeft: -24,
    zIndex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: `${colors.accent}30`,
  },
  teamLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  teamLabelText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  teamNames: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  avgRating: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  avgRatingLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  individualRatings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xl,
    width: '100%',
  },
  individualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  individualName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  individualRating: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  individualDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  singlesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  singlesButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  leaveButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  leaveButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
