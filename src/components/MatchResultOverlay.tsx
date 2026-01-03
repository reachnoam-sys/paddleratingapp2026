import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  useDerivedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import type { Player } from '../types';
import { eloToRating } from '../utils';

// Animated text component for count-up effect
const AnimatedText = Animated.createAnimatedComponent(Text);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MatchResultOverlayProps {
  visible: boolean;
  isWin: boolean;
  previousElo: number;
  newElo: number;
  opponents: Player[];
  timestamp?: Date;
  onBackToCourt: () => void;
  onViewActivity: () => void;
}

// Premium spring configuration matching existing patterns
const springConfig = {
  damping: 28,
  stiffness: 280,
  mass: 0.8,
};

export function MatchResultOverlay({
  visible,
  isWin,
  previousElo,
  newElo,
  opponents,
  timestamp = new Date(),
  onBackToCourt,
  onViewActivity,
}: MatchResultOverlayProps) {
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(40);
  const deltaScale = useSharedValue(0.95);
  const deltaOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  // Count-up animation value (0 to 1 progress)
  const countUpProgress = useSharedValue(0);
  const [displayedDelta, setDisplayedDelta] = useState(0);
  const [hasSettled, setHasSettled] = useState(false);

  const eloDelta = newElo - previousElo;
  const previousRating = eloToRating(previousElo);
  const newRating = eloToRating(newElo);

  // Callback to trigger haptic when count-up completes
  const onCountUpComplete = useCallback(() => {
    setHasSettled(true);
    // Light success haptic on final ELO settle (per spec)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Derived value to update displayed delta during count-up
  useDerivedValue(() => {
    const currentDelta = Math.round(countUpProgress.value * eloDelta);
    runOnJS(setDisplayedDelta)(currentDelta);

    // Check if count-up complete
    if (countUpProgress.value >= 1 && !hasSettled) {
      runOnJS(onCountUpComplete)();
    }
  }, [eloDelta, hasSettled]);

  useEffect(() => {
    if (visible) {
      // Reset state
      setHasSettled(false);
      setDisplayedDelta(0);
      countUpProgress.value = 0;

      // Sequence of premium animations
      // 1. Fade in overlay
      overlayOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      // 2. Scale up + fade in card
      cardScale.value = withSpring(1, springConfig);
      cardOpacity.value = withTiming(1, { duration: 250 });
      cardTranslateY.value = withSpring(0, springConfig);

      // 3. Animate delta scale (0.95 → 1.0 per spec) with easeOutCubic
      deltaScale.value = withDelay(
        150,
        withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        })
      );
      deltaOpacity.value = withDelay(150, withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      }));

      // 4. Count-up animation for ELO delta (300-500ms per spec)
      countUpProgress.value = withDelay(
        200,
        withTiming(1, {
          duration: 400, // 400ms count-up
          easing: Easing.out(Easing.cubic),
        })
      );

      // 5. Fade in supporting content
      contentOpacity.value = withDelay(450, withTiming(1, { duration: 250 }));

      // 6. Slide up buttons
      buttonOpacity.value = withDelay(550, withTiming(1, { duration: 250 }));
      buttonTranslateY.value = withDelay(550, withSpring(0, { damping: 20, stiffness: 200 }));
    } else {
      // Reset all values
      overlayOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = 0.85;
      cardOpacity.value = 0;
      cardTranslateY.value = 40;
      deltaScale.value = 0.95;
      deltaOpacity.value = 0;
      contentOpacity.value = 0;
      buttonOpacity.value = 0;
      buttonTranslateY.value = 20;
      countUpProgress.value = 0;
      setDisplayedDelta(0);
      setHasSettled(false);
    }
  }, [visible]);

  const handleBackToCourt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Animate out
    overlayOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.9, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onBackToCourt)();
    });
  };

  const handleViewActivity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animate out then navigate
    overlayOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.9, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onViewActivity)();
    });
  };

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
    opacity: cardOpacity.value,
  }));

  const deltaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deltaScale.value }],
    opacity: deltaOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const buttonContainerStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // Format timestamp
  const getTimeLabel = () => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    if (diff < 60000) return 'Just now';
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]} />

      {/* Result Card */}
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        <View style={styles.card}>
          {/* Win/Loss Label */}
          <Animated.View style={contentStyle}>
            <View style={[styles.resultBadge, isWin ? styles.winBadge : styles.lossBadge]}>
              <Text style={[styles.resultBadgeText, isWin ? styles.winBadgeText : styles.lossBadgeText]}>
                {isWin ? 'Victory' : 'Defeat'}
              </Text>
            </View>
          </Animated.View>

          {/* Rating Delta - Hero Element with count-up animation */}
          <Animated.View style={[styles.deltaContainer, deltaStyle]}>
            <Text style={[styles.deltaText, isWin ? styles.deltaPositive : styles.deltaNegative]}>
              {displayedDelta >= 0 ? '+' : ''}{displayedDelta}
            </Text>
            <Text style={styles.deltaLabel}>ELO</Text>
          </Animated.View>

          {/* Rating Transition */}
          <Animated.View style={[styles.ratingTransition, contentStyle]}>
            <Text style={styles.previousRating}>{previousRating}</Text>
            <View style={styles.ratingArrow}>
              <Text style={styles.ratingArrowText}>→</Text>
            </View>
            <Text style={[styles.newRating, isWin ? styles.newRatingPositive : styles.newRatingNegative]}>
              {newRating}
            </Text>
          </Animated.View>

          {/* Opponent Avatars */}
          <Animated.View style={[styles.opponentsSection, contentStyle]}>
            <Text style={styles.versusLabel}>vs</Text>
            <View style={styles.opponentAvatars}>
              {opponents.slice(0, 2).map((opponent, index) => (
                <Image
                  key={opponent.id}
                  source={{ uri: opponent.avatar }}
                  style={[
                    styles.opponentAvatar,
                    index > 0 && styles.opponentAvatarOverlap,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.opponentNames}>
              {opponents.map(o => o.name.split(' ')[0]).join(' & ')}
            </Text>
          </Animated.View>

          {/* Timestamp */}
          <Animated.Text style={[styles.timestamp, contentStyle]}>
            {getTimeLabel()}
          </Animated.Text>
        </View>

        {/* Actions */}
        <Animated.View style={[styles.actions, buttonContainerStyle]}>
          <Pressable
            style={styles.primaryButton}
            onPress={handleBackToCourt}
          >
            <Text style={styles.primaryButtonText}>Back to Court</Text>
          </Pressable>

          <Pressable onPress={handleViewActivity}>
            <Text style={styles.secondaryLink}>View activity</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blackOverlay,
  },
  cardContainer: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    maxWidth: 360,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  resultBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  winBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
  },
  lossBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  winBadgeText: {
    color: colors.accent,
  },
  lossBadgeText: {
    color: colors.red,
  },
  deltaContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deltaText: {
    ...typography.heroLarge,
    fontWeight: '600',
  },
  deltaPositive: {
    color: colors.accent,
  },
  deltaNegative: {
    color: colors.red,
  },
  deltaLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ratingTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  previousRating: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  ratingArrow: {
    paddingHorizontal: spacing.sm,
  },
  ratingArrowText: {
    color: colors.textMuted,
    fontSize: 18,
  },
  newRating: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  newRatingPositive: {
    color: colors.accent,
  },
  newRatingNegative: {
    color: colors.red,
  },
  opponentsSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  versusLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  opponentAvatars: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  opponentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.card,
  },
  opponentAvatarOverlap: {
    marginLeft: -12,
  },
  opponentNames: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actions: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryLink: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
