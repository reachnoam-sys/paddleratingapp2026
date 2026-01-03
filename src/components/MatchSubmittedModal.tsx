import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Share } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, Share2, MapPin } from 'lucide-react-native';
import { colors } from '../theme/colors';
import type { Match } from '../store';
import { eloToRating, getNewElo } from '../utils/rating';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchSubmittedModalProps {
  visible: boolean;
  match: Match | null;
  userElo?: number;
  opponentElo?: number;
  onBackToCourt: () => void;
  onViewActivity: () => void;
}

// Premium spring configurations - tuned for 120Hz displays
const springConfig = {
  damping: 26,
  stiffness: 260,
  mass: 0.9,
};

const celebrateSpring = {
  damping: 12,
  stiffness: 400,
  mass: 0.5,
};

export function MatchSubmittedModal({
  visible,
  match,
  userElo = 1200,
  opponentElo,
  onBackToCourt,
  onViewActivity,
}: MatchSubmittedModalProps) {
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const checkScale = useSharedValue(0);
  const checkGlow = useSharedValue(0);
  const ratingScale = useSharedValue(0);
  const ratingGlow = useSharedValue(0);
  const arrowProgress = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(16);
  const shareButtonScale = useSharedValue(0);

  // Calculate rating change on display scale
  const isWin = match ? match.teamAWins > match.teamBWins : false;
  const avgOpponentElo = opponentElo ?? (match?.teamB?.[0]?.ratingBefore ?? 1200);
  const newElo = getNewElo(userElo, avgOpponentElo, isWin);

  // Convert to display ratings (2.0-6.0 scale)
  const oldRating = eloToRating(userElo);
  const newRating = eloToRating(newElo);
  const ratingDelta = (parseFloat(newRating) - parseFloat(oldRating)).toFixed(1);
  const ratingDeltaDisplay = parseFloat(ratingDelta) >= 0 ? `+${ratingDelta}` : ratingDelta;
  const isGain = parseFloat(ratingDelta) >= 0;

  useEffect(() => {
    if (visible) {
      // Phase 1: Overlay fade in
      overlayOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      // Phase 2: Card entrance
      cardScale.value = withDelay(50, withSpring(1, springConfig));
      cardOpacity.value = withDelay(50, withTiming(1, { duration: 250 }));
      cardTranslateY.value = withDelay(50, withSpring(0, springConfig));

      // Phase 3: Checkmark pop with glow
      checkScale.value = withDelay(
        200,
        withSpring(1, { damping: 12, stiffness: 350 })
      );
      checkGlow.value = withDelay(
        250,
        withSequence(
          withTiming(1, { duration: 180 }),
          withTiming(0.5, { duration: 350 })
        )
      );

      // Phase 4: Rating reveal - the hero moment
      ratingScale.value = withDelay(
        380,
        withSequence(
          withSpring(1.06, celebrateSpring),
          withSpring(1, { damping: 16, stiffness: 220 })
        )
      );

      arrowProgress.value = withDelay(
        480,
        withSpring(1, { damping: 18, stiffness: 200 })
      );

      // Glow pulse on rating
      ratingGlow.value = withDelay(
        420,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0.3, { duration: 500 })
        )
      );

      // Phase 5: Match details
      contentOpacity.value = withDelay(580, withTiming(1, { duration: 250 }));

      // Share button
      shareButtonScale.value = withDelay(
        650,
        withSpring(1, { damping: 14, stiffness: 220 })
      );

      // Phase 6: Action buttons
      buttonOpacity.value = withDelay(700, withTiming(1, { duration: 250 }));
      buttonTranslateY.value = withDelay(700, withSpring(0, { damping: 20, stiffness: 200 }));

      // Haptic: Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Reset
      overlayOpacity.value = withTiming(0, { duration: 180 });
      cardScale.value = 0.9;
      cardOpacity.value = 0;
      cardTranslateY.value = 30;
      checkScale.value = 0;
      checkGlow.value = 0;
      ratingScale.value = 0;
      ratingGlow.value = 0;
      arrowProgress.value = 0;
      contentOpacity.value = 0;
      buttonOpacity.value = 0;
      buttonTranslateY.value = 16;
      shareButtonScale.value = 0;
    }
  }, [visible]);

  const handleBackToCourt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    overlayOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.95, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onBackToCourt)();
    });
  };

  const handleViewActivity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    overlayOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.95, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onViewActivity)();
    });
  };

  const handleShare = async () => {
    if (!match) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const opponentNames = match.teamB.map(o => o.name.split(' ')[0]).join(' & ');
    const scoreDisplay = `${match.teamAWins}–${match.teamBWins}`;
    const resultText = isWin ? 'Won' : 'Played';

    const shareMessage = `${resultText} ${scoreDisplay} vs ${opponentNames} at ${match.courtName}! My rating: ${oldRating} → ${newRating} 🏓\n\nTrack your games on PaddleRating`;

    try {
      await Share.share({ message: shareMessage });
    } catch {
      // Silently fail
    }
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

  const checkContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const checkGlowStyle = useAnimatedStyle(() => ({
    opacity: checkGlow.value * 0.4,
    transform: [{ scale: 1 + checkGlow.value * 0.25 }],
  }));

  const ratingContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ratingScale.value }],
    opacity: ratingScale.value,
  }));

  const ratingGlowStyle = useAnimatedStyle(() => ({
    opacity: ratingGlow.value * 0.25,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: arrowProgress.value,
    transform: [{ translateX: (1 - arrowProgress.value) * -8 }],
  }));

  const newRatingStyle = useAnimatedStyle(() => ({
    opacity: arrowProgress.value,
    transform: [{ translateX: (1 - arrowProgress.value) * -6 }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const shareButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareButtonScale.value }],
    opacity: shareButtonScale.value,
  }));

  const buttonContainerStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  if (!visible || !match) return null;

  const scoreDisplay = `${match.teamAWins}–${match.teamBWins}`;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, overlayStyle]} />

      <Animated.View style={[styles.cardContainer, cardStyle]}>
        <View style={styles.card}>
          {/* Share button */}
          <Animated.View style={[styles.shareButtonContainer, shareButtonStyle]}>
            <Pressable
              style={styles.shareButton}
              onPress={handleShare}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Share2 size={15} color={colors.textMuted} />
            </Pressable>
          </Animated.View>

          {/* Success checkmark */}
          <View style={styles.checkWrapper}>
            <Animated.View style={[styles.checkGlow, checkGlowStyle]} />
            <Animated.View style={[styles.checkContainer, checkContainerStyle]}>
              <View style={styles.checkCircle}>
                <Check size={24} color={colors.accent} strokeWidth={3} />
              </View>
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Match Submitted</Text>

          {/* Rating Section */}
          <Animated.View style={[styles.ratingSection, ratingContainerStyle]}>
            <Animated.View style={[styles.ratingGlow, ratingGlowStyle]} />

            <View style={styles.ratingRow}>
              <Text style={styles.oldRating}>{oldRating}</Text>
              <Animated.View style={arrowStyle}>
                <Text style={[styles.ratingArrow, isGain ? styles.textGain : styles.textLoss]}>→</Text>
              </Animated.View>
              <Animated.View style={newRatingStyle}>
                <Text style={[styles.newRating, isGain ? styles.textGain : styles.textLoss]}>
                  {newRating}
                </Text>
              </Animated.View>
            </View>

            <View style={[styles.deltaPill, isGain ? styles.deltaPillGain : styles.deltaPillLoss]}>
              <Text style={[styles.deltaText, isGain ? styles.textGain : styles.textLoss]}>
                {ratingDeltaDisplay}
              </Text>
            </View>

            <Text style={styles.provisionalLabel}>Provisional Rating</Text>
          </Animated.View>

          {/* Match Summary */}
          <Animated.View style={[styles.matchSummary, contentStyle]}>
            {/* Teams Row */}
            <View style={styles.teamsContainer}>
              {/* User's Team */}
              <View style={styles.teamBlock}>
                <View style={styles.avatarStack}>
                  {match.teamA.slice(0, 2).map((player, index) => (
                    <Image
                      key={player.id}
                      source={{ uri: player.avatarUrl || 'https://i.pravatar.cc/150' }}
                      style={[styles.avatar, index > 0 && styles.avatarOverlap]}
                    />
                  ))}
                </View>
                <Text style={styles.teamNames} numberOfLines={1}>
                  {match.teamA.map(p => p.name.split(' ')[0]).join(' & ')}
                </Text>
              </View>

              {/* Score */}
              <View style={styles.scoreBlock}>
                <Text style={[styles.scoreText, isWin ? styles.textGain : styles.textLoss]}>
                  {scoreDisplay}
                </Text>
                <Text style={styles.gameCount}>
                  {match.games.length === 1 ? '1 game' : `${match.games.length} games`}
                </Text>
              </View>

              {/* Opponents */}
              <View style={styles.teamBlock}>
                <View style={styles.avatarStack}>
                  {match.teamB.slice(0, 2).map((opponent, index) => (
                    <Image
                      key={opponent.id}
                      source={{ uri: opponent.avatarUrl || 'https://i.pravatar.cc/150' }}
                      style={[styles.avatar, index > 0 && styles.avatarOverlap]}
                    />
                  ))}
                </View>
                <Text style={styles.teamNames} numberOfLines={1}>
                  {match.teamB.map(o => o.name.split(' ')[0]).join(' & ')}
                </Text>
              </View>
            </View>

            {/* Court */}
            <View style={styles.courtRow}>
              <MapPin size={11} color={colors.textMuted} />
              <Text style={styles.courtText} numberOfLines={1}>{match.courtName}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Actions */}
        <Animated.View style={[styles.actions, buttonContainerStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed
            ]}
            onPress={handleBackToCourt}
          >
            <Text style={styles.primaryButtonText}>Back to Court</Text>
          </Pressable>

          <Pressable
            onPress={handleViewActivity}
            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
          >
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
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shareButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  checkGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: colors.accent,
    borderRadius: 32,
  },
  checkContainer: {
    position: 'relative',
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(57, 255, 20, 0.35)',
  },
  title: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(57, 255, 20, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  ratingGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  oldRating: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: -0.5,
  },
  ratingArrow: {
    fontSize: 20,
    fontWeight: '400',
  },
  newRating: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  textGain: {
    color: colors.accent,
  },
  textLoss: {
    color: colors.red,
  },
  deltaPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  deltaPillGain: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
  },
  deltaPillLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  provisionalLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  matchSummary: {
    width: '100%',
    alignItems: 'center',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  teamNames: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  gameCount: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
  },
  courtText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryLink: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
