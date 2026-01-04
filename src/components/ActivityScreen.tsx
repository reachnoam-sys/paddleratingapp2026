import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeInDown,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { X, Check, Flag, Clock, Trophy, Swords, ChevronDown, ChevronUp, MapPin, Calendar, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useMatchStore, Match } from '../store';
import { getNewElo } from '../utils/rating';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ultra-premium spring configs for buttery 60fps animations
const snapBackSpring = {
  damping: 32,
  stiffness: 400,
  mass: 0.7,
};

// Card animation config
const springConfig = {
  damping: 24,
  stiffness: 280,
  mass: 0.85,
};

interface ActivityScreenProps {
  onClose?: () => void;
  onSwipeToHome?: () => void;
  onSwipeToProfile?: () => void;
  scrollToMatchId?: string | null;
  onClearScrollTarget?: () => void;
}

// Premium Activity Match Card with flip animation
interface ActivityMatchCardProps {
  match: Match;
  onConfirm: () => void;
  onContest: () => void;
  index: number;
  isHighlighted?: boolean;
  userElo?: number;
}

function ActivityMatchCard({
  match,
  onConfirm,
  onContest,
  index,
  isHighlighted,
  userElo = 1200,
}: ActivityMatchCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const scale = useSharedValue(1);
  const borderGlow = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const chevronRotation = useSharedValue(0);

  // Flip animation values
  const flipRotation = useSharedValue(0);
  const frontOpacity = useSharedValue(1);
  const backOpacity = useSharedValue(0);

  // Calculate provisional rating change
  const isWin = match.teamAWins > match.teamBWins;
  const avgOpponentElo = match.teamB[0]?.ratingBefore ?? 1200;
  const newElo = getNewElo(userElo, avgOpponentElo, isWin);
  const ratingDelta = ((newElo - userElo) / 1200 * 3.5).toFixed(1);
  const ratingDeltaDisplay = parseFloat(ratingDelta) >= 0 ? `+${ratingDelta}` : ratingDelta;

  // Entrance animation
  useEffect(() => {
    const delay = index * 80;
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(delay, withSpring(0, springConfig));

    if (isHighlighted) {
      borderGlow.value = withDelay(
        delay + 200,
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 600 })
        )
      );
    }
  }, [index, isHighlighted]);

  // Update countdown timer for pending matches
  useEffect(() => {
    if (match.status !== 'pending' || isConfirmed) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = match.expiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m left`);
      } else {
        setTimeRemaining(`${minutes}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [match.status, match.expiresAt, isConfirmed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: cardTranslateY.value },
    ],
    opacity: cardOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(57, 255, 20, ${borderGlow.value * 0.6})`,
    shadowOpacity: borderGlow.value * 0.4,
    shadowRadius: borderGlow.value * 20,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  // Flip animation styles
  const frontCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${flipRotation.value}deg` },
    ],
    opacity: frontOpacity.value,
    backfaceVisibility: 'hidden',
  }));

  const backCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${flipRotation.value + 180}deg` },
    ],
    opacity: backOpacity.value,
    backfaceVisibility: 'hidden',
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleCardPress = () => {
    if (isConfirmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
    chevronRotation.value = withSpring(isExpanded ? 0 : 180, { damping: 15, stiffness: 300 });
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Trigger flip animation
    flipRotation.value = withTiming(180, {
      duration: 600,
      easing: Easing.inOut(Easing.cubic)
    });
    frontOpacity.value = withDelay(300, withTiming(0, { duration: 1 }));
    backOpacity.value = withDelay(300, withTiming(1, { duration: 1 }));

    setIsConfirmed(true);
    onConfirm();
  };

  const scoreDisplay = `${match.teamAWins}–${match.teamBWins}`;
  const needsConfirmation = match.status === 'pending' && !isConfirmed;
  const showAsConfirmed = match.status === 'confirmed' || isConfirmed;

  // Format timestamp
  const getTimeLabel = () => {
    const now = Date.now();
    const diff = now - match.createdAt;
    if (diff < 60000) return 'Just now';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Format date and time
  const getDateTime = () => {
    const date = new Date(match.createdAt);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Get result badge config
  const getResultConfig = () => {
    if (showAsConfirmed) {
      return isWin
        ? { label: 'Victory', color: colors.accent, bg: 'rgba(57, 255, 20, 0.12)' }
        : { label: 'Defeat', color: colors.red, bg: 'rgba(239, 68, 68, 0.12)' };
    }
    if (match.status === 'pending') {
      return { label: 'Pending', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    }
    if (match.status === 'disputed') {
      return { label: 'Contested', color: colors.red, bg: 'rgba(239, 68, 68, 0.12)' };
    }
    return { label: 'Expired', color: colors.textMuted, bg: 'rgba(255, 255, 255, 0.06)' };
  };

  const resultConfig = getResultConfig();

  // Card content component (reused for front and back)
  const CardContent = ({ isBack = false }: { isBack?: boolean }) => (
    <>
      {/* Header row with status and time */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: isBack ? colors.accent : resultConfig.color }]} />
          <Text style={styles.statusLabel}>
            {match.mode === 'singles' ? 'Singles' : 'Doubles'}
          </Text>
        </View>
        <Text style={styles.timeLabel}>{getTimeLabel()}</Text>
      </View>

      {/* Teams display */}
      <View style={styles.teamsRow}>
        <View style={styles.teamBlock}>
          <View style={styles.avatarStack}>
            {match.teamA.slice(0, 2).map((player, idx) => (
              <Image
                key={player.id}
                source={{ uri: player.avatarUrl || 'https://i.pravatar.cc/150' }}
                style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
              />
            ))}
          </View>
          <Text style={styles.teamNames} numberOfLines={1}>
            {match.teamA.map(p => p.name.split(' ')[0]).join(' & ')}
          </Text>
        </View>

        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreText, isWin ? styles.scoreWin : styles.scoreLoss]}>
            {scoreDisplay}
          </Text>
          <Text style={styles.gamesLabel}>
            {match.games.length === 1 ? '1 game' : `${match.games.length} games`}
          </Text>
        </View>

        <View style={styles.teamBlock}>
          <View style={styles.avatarStack}>
            {match.teamB.slice(0, 2).map((player, idx) => (
              <Image
                key={player.id}
                source={{ uri: player.avatarUrl || 'https://i.pravatar.cc/150' }}
                style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
              />
            ))}
          </View>
          <Text style={styles.teamNames} numberOfLines={1}>
            {match.teamB.map(p => p.name.split(' ')[0]).join(' & ')}
          </Text>
        </View>
      </View>

      {/* Result badge and rating change */}
      <View style={styles.resultRow}>
        <View style={[styles.resultBadge, { backgroundColor: isBack ? 'rgba(57, 255, 20, 0.12)' : resultConfig.bg }]}>
          {(showAsConfirmed || isBack) && isWin && (
            <Trophy size={12} color={isBack ? colors.accent : resultConfig.color} />
          )}
          {(showAsConfirmed || isBack) && !isWin && (
            <Swords size={12} color={isBack ? colors.accent : resultConfig.color} />
          )}
          {!showAsConfirmed && !isBack && match.status === 'pending' && (
            <Clock size={12} color={resultConfig.color} />
          )}
          {match.status === 'disputed' && !isBack && (
            <Flag size={12} color={resultConfig.color} />
          )}
          <Text style={[styles.resultText, { color: isBack ? colors.accent : resultConfig.color }]}>
            {isBack ? 'Confirmed' : resultConfig.label}
          </Text>
        </View>

        <View style={[styles.ratingDeltaBadge, isWin ? styles.ratingDeltaGain : styles.ratingDeltaLoss]}>
          <Text style={[styles.ratingDeltaText, isWin ? styles.ratingDeltaTextGain : styles.ratingDeltaTextLoss]}>
            {ratingDeltaDisplay}
          </Text>
        </View>

        {!isBack && match.status === 'pending' && !isConfirmed && timeRemaining && (
          <Text style={styles.expiryText}>{timeRemaining}</Text>
        )}
      </View>

      {/* Location and expand indicator */}
      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <MapPin size={11} color={colors.textMuted} />
          <Text style={styles.courtName}>{match.courtName}</Text>
        </View>
        {!isBack && (
          <Animated.View style={chevronStyle}>
            {isExpanded ? (
              <ChevronUp size={16} color={colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={colors.textMuted} />
            )}
          </Animated.View>
        )}
        {isBack && (
          <View style={styles.confirmedCheck}>
            <Check size={14} color={colors.accent} strokeWidth={3} />
          </View>
        )}
      </View>

      {/* Expandable details section */}
      {isExpanded && !isBack && (
        <View style={styles.expandedContent}>
          <View style={styles.detailRow}>
            <Calendar size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{getDateTime()}</Text>
          </View>

          <View style={styles.scoresSection}>
            <Text style={styles.scoresTitle}>Game Scores</Text>
            <View style={styles.scoresGrid}>
              {match.games.map((game, idx) => (
                <View key={idx} style={styles.gameScoreItem}>
                  <Text style={styles.gameLabel}>Game {idx + 1}</Text>
                  <Text style={[
                    styles.gameScore,
                    game.teamAScore > game.teamBScore ? styles.scoreWin : styles.scoreLoss
                  ]}>
                    {game.teamAScore}–{game.teamBScore}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </>
  );

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <View style={styles.flipContainer}>
        {/* Front of card (pending state) */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            isHighlighted && styles.cardHighlighted,
            isHighlighted && glowStyle,
            frontCardStyle,
          ]}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleCardPress}
            style={styles.cardPressable}
          >
            <CardContent isBack={false} />
          </Pressable>
        </Animated.View>

        {/* Back of card (confirmed state) */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { borderColor: colors.accent, borderWidth: 2 },
            backCardStyle,
          ]}
        >
          <View style={styles.cardPressable}>
            <CardContent isBack={true} />
          </View>
        </Animated.View>
      </View>

      {/* Confirmation actions for pending matches */}
      {needsConfirmation && (
        <Animated.View
          style={styles.actionsRow}
          entering={FadeInDown.delay(index * 80 + 200).duration(300)}
        >
          <Pressable
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Check size={16} color={colors.black} strokeWidth={2.5} />
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </Pressable>
          <Pressable
            style={styles.contestButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onContest();
            }}
          >
            <Flag size={14} color={colors.textSecondary} />
            <Text style={styles.contestButtonText}>Contest</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// Premium contest confirmation sheet with weekly limit warning
function ContestSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [step, setStep] = useState<'confirm' | 'reason'>('confirm');
  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);
  const warningScale = useSharedValue(0.9);
  const warningOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setStep('confirm');
      translateY.value = withSpring(0, { damping: 28, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 250 });
      warningScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
      warningOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
    } else {
      translateY.value = withTiming(400, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      warningScale.value = 0.9;
      warningOpacity.value = 0;
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const warningStyle = useAnimatedStyle(() => ({
    transform: [{ scale: warningScale.value }],
    opacity: warningOpacity.value,
  }));

  const reasons = [
    { id: 'wrong_score', label: 'Score is incorrect' },
    { id: 'wrong_players', label: 'Wrong players listed' },
    { id: 'did_not_play', label: "I didn't play this match" },
    { id: 'other', label: 'Other issue' },
  ];

  const handleProceed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('reason');
  };

  const handleSelectReason = (reason: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onSubmit(reason);
    setStep('confirm');
  };

  const handleClose = () => {
    setStep('confirm');
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={contestStyles.container}>
      <Animated.View style={[contestStyles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[contestStyles.sheet, sheetStyle]}>
        <View style={contestStyles.handle} />

        {step === 'confirm' ? (
          <>
            {/* Warning header */}
            <Animated.View style={[contestStyles.warningHeader, warningStyle]}>
              <View style={contestStyles.warningIconContainer}>
                <AlertTriangle size={28} color="#F59E0B" />
              </View>
              <Text style={contestStyles.title}>Contest this match?</Text>
            </Animated.View>

            {/* Warning message */}
            <Animated.View style={[contestStyles.warningCard, warningStyle]}>
              <Text style={contestStyles.warningTitle}>Before you proceed</Text>
              <View style={contestStyles.warningItem}>
                <View style={contestStyles.warningBullet} />
                <Text style={contestStyles.warningText}>
                  You can only contest <Text style={contestStyles.warningHighlight}>1 match per week</Text>
                </Text>
              </View>
              <View style={contestStyles.warningItem}>
                <View style={contestStyles.warningBullet} />
                <Text style={contestStyles.warningText}>
                  This match will be <Text style={contestStyles.warningHighlight}>removed for all players</Text>
                </Text>
              </View>
              <View style={contestStyles.warningItem}>
                <View style={contestStyles.warningBullet} />
                <Text style={contestStyles.warningText}>
                  The submitter will receive a <Text style={contestStyles.warningHighlight}>warning on their account</Text>
                </Text>
              </View>
            </Animated.View>

            {/* Remaining contests indicator */}
            <View style={contestStyles.remainingBadge}>
              <Text style={contestStyles.remainingText}>1 contest remaining this week</Text>
            </View>

            {/* Actions */}
            <View style={contestStyles.confirmActions}>
              <Pressable
                style={contestStyles.proceedButton}
                onPress={handleProceed}
              >
                <Text style={contestStyles.proceedButtonText}>Yes, contest this match</Text>
              </Pressable>
              <Pressable style={contestStyles.cancelButton} onPress={handleClose}>
                <Text style={contestStyles.cancelText}>Keep the match</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={contestStyles.reasonTitle}>What's the issue?</Text>
            <Text style={contestStyles.reasonSubtitle}>
              Select the reason for contesting
            </Text>

            {reasons.map((reason, index) => (
              <Animated.View
                key={reason.id}
                entering={FadeInDown.delay(index * 50).duration(250)}
              >
                <Pressable
                  style={contestStyles.reasonButton}
                  onPress={() => handleSelectReason(reason.id)}
                >
                  <Text style={contestStyles.reasonText}>{reason.label}</Text>
                </Pressable>
              </Animated.View>
            ))}

            <Pressable
              style={contestStyles.backButton}
              onPress={() => setStep('confirm')}
            >
              <Text style={contestStyles.backText}>Go back</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const contestStyles = StyleSheet.create({
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
    padding: spacing.xl,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  warningHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  warningIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  warningBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
    marginTop: 7,
    marginRight: spacing.sm,
  },
  warningText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  warningHighlight: {
    color: colors.white,
    fontWeight: '600',
  },
  remainingBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
  },
  remainingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  confirmActions: {
    gap: spacing.sm,
  },
  proceedButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  reasonTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reasonSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  reasonButton: {
    backgroundColor: colors.cardSecondary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reasonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  backText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
});

// Main Activity Screen component
export function ActivityScreen({
  onClose,
  onSwipeToHome,
  onSwipeToProfile,
  scrollToMatchId,
  onClearScrollTarget,
}: ActivityScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [contestMatchId, setContestMatchId] = useState<string | null>(null);

  // Animation values for screen entrance
  const screenOpacity = useSharedValue(0);
  const screenTranslateX = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    headerTranslateY.value = withSpring(0, springConfig);
  }, []);

  const {
    matches,
    pendingMatches,
    confirmedMatches,
    disputedMatches,
    expiredMatches,
    confirmMatch,
    disputeMatch,
    checkExpiredMatches,
    seedMockMatches,
  } = useMatchStore();

  // Seed mock data on mount for testing
  useEffect(() => {
    seedMockMatches();
  }, []);

  // All matches sorted by most recent
  const allMatches = [...matches].sort((a, b) => b.createdAt - a.createdAt);

  // Check for expired matches periodically
  useEffect(() => {
    checkExpiredMatches();
    const interval = setInterval(checkExpiredMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clear scroll target after rendering
  useEffect(() => {
    if (scrollToMatchId && onClearScrollTarget) {
      const timer = setTimeout(onClearScrollTarget, 2000);
      return () => clearTimeout(timer);
    }
  }, [scrollToMatchId, onClearScrollTarget]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    checkExpiredMatches();
    setTimeout(() => setRefreshing(false), 500);
  }, [checkExpiredMatches]);

  const handleConfirm = (matchId: string) => {
    confirmMatch(matchId, 'current-user');
  };

  const handleContest = (matchId: string) => {
    setContestMatchId(matchId);
  };

  const handleContestSubmit = (reason: string) => {
    if (contestMatchId) {
      disputeMatch(contestMatchId, reason);
      setContestMatchId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    screenOpacity.value = withTiming(0, { duration: 200 }, () => {
      if (onClose) runOnJS(onClose)();
    });
  };

  // Ultra-smooth swipe gesture for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onStart(() => {
      'worklet';
      // Cancel any ongoing animations for immediate response
      cancelAnimation(screenTranslateX);
      cancelAnimation(screenOpacity);
    })
    .onUpdate((event) => {
      'worklet';
      // Swipe right to go to Home
      if (event.translationX > 0 && onSwipeToHome) {
        // Use cubic easing for natural feel - faster at start, slower at end
        const progress = Math.min(event.translationX / SCREEN_WIDTH, 1);
        const easedProgress = progress * (2 - progress); // Quadratic ease out
        screenTranslateX.value = easedProgress * SCREEN_WIDTH * 0.8;
        screenOpacity.value = interpolate(
          progress,
          [0, 0.5, 1],
          [1, 0.85, 0.4],
          Extrapolation.CLAMP
        );
      }
      // Swipe left to go to Profile
      if (event.translationX < 0 && onSwipeToProfile) {
        const progress = Math.min(Math.abs(event.translationX) / SCREEN_WIDTH, 1);
        const easedProgress = progress * (2 - progress);
        screenTranslateX.value = -easedProgress * SCREEN_WIDTH * 0.8;
        screenOpacity.value = interpolate(
          progress,
          [0, 0.5, 1],
          [1, 0.85, 0.4],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      'worklet';
      const velocity = event.velocityX;
      const translation = event.translationX;

      // Lower threshold for faster flicks, higher for slow drags
      const velocityThreshold = 400;
      const distanceThreshold = SCREEN_WIDTH * 0.2;

      // Swipe right threshold - go to Home
      if (translation > distanceThreshold || velocity > velocityThreshold) {
        if (onSwipeToHome) {
          // Butter-smooth exit with velocity-based duration
          const baseDuration = 280;
          const velocityBonus = Math.min(Math.abs(velocity) / 2000, 0.5);
          const duration = baseDuration * (1 - velocityBonus);

          screenTranslateX.value = withTiming(SCREEN_WIDTH, {
            duration,
            easing: Easing.out(Easing.cubic),
          });
          screenOpacity.value = withTiming(0, { duration: duration * 0.7 }, () => {
            runOnJS(onSwipeToHome)();
          });
          return;
        }
      }

      // Swipe left threshold - go to Profile
      if (translation < -distanceThreshold || velocity < -velocityThreshold) {
        if (onSwipeToProfile) {
          const baseDuration = 280;
          const velocityBonus = Math.min(Math.abs(velocity) / 2000, 0.5);
          const duration = baseDuration * (1 - velocityBonus);

          screenTranslateX.value = withTiming(-SCREEN_WIDTH, {
            duration,
            easing: Easing.out(Easing.cubic),
          });
          screenOpacity.value = withTiming(0, { duration: duration * 0.7 }, () => {
            runOnJS(onSwipeToProfile)();
          });
          return;
        }
      }

      // Snap back with premium spring physics
      screenTranslateX.value = withSpring(0, snapBackSpring);
      screenOpacity.value = withSpring(1, snapBackSpring);
    });

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateX: screenTranslateX.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.container, screenStyle]}>
        {/* Header with close button */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSubtitle}>Your recent matches</Text>
          </View>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        >
          {/* Pending confirmation section with accent highlight */}
          {pendingMatches.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.pendingDot} />
                  <Text style={styles.sectionTitle}>Needs confirmation</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{pendingMatches.length}</Text>
                </View>
              </View>
              {pendingMatches.map((match, index) => (
                <ActivityMatchCard
                  key={match.id}
                  match={match}
                  index={index}
                  onConfirm={() => handleConfirm(match.id)}
                  onContest={() => handleContest(match.id)}
                  isHighlighted={match.id === scrollToMatchId}
                />
              ))}
            </View>
          )}

          {/* Recent activity section */}
          {confirmedMatches.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
              </View>
              {confirmedMatches.slice(0, 10).map((match, index) => (
                <ActivityMatchCard
                  key={match.id}
                  match={match}
                  index={index + pendingMatches.length}
                  onConfirm={() => {}}
                  onContest={() => {}}
                  isHighlighted={match.id === scrollToMatchId}
                />
              ))}
            </View>
          )}

          {/* Contested matches */}
          {(disputedMatches.length > 0 || expiredMatches.length > 0) && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, styles.sectionTitleMuted]}>
                  Contested & Expired
                </Text>
              </View>
              {[...disputedMatches, ...expiredMatches].map((match, index) => (
                <ActivityMatchCard
                  key={match.id}
                  match={match}
                  index={index + pendingMatches.length + confirmedMatches.length}
                  onConfirm={() => {}}
                  onContest={() => {}}
                />
              ))}
            </View>
          )}

          {/* Empty state */}
          {allMatches.length === 0 && (
            <Animated.View
              style={styles.emptyState}
              entering={FadeIn.delay(300).duration(400)}
            >
              <View style={styles.emptyIconContainer}>
                <Trophy size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>
                Play a game and log the score to see your activity here
              </Text>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Contest sheet */}
        <ContestSheet
          visible={contestMatchId !== null}
          onClose={() => setContestMatchId(null)}
          onSubmit={handleContestSubmit}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionContainer: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleMuted: {
    color: colors.textMuted,
  },
  countBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  countText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  // Card styles
  cardContainer: {
    marginBottom: spacing.md,
  },
  flipContainer: {
    position: 'relative',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  cardFront: {
    position: 'relative',
    zIndex: 2,
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  cardPressable: {
    padding: spacing.xl,
  },
  cardHighlighted: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarOverlap: {
    marginLeft: -14,
  },
  teamNames: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 90,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreWin: {
    color: colors.accent,
  },
  scoreLoss: {
    color: colors.red,
  },
  gamesLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ratingDeltaBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  ratingDeltaGain: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
  },
  ratingDeltaLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  ratingDeltaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ratingDeltaTextGain: {
    color: colors.accent,
  },
  ratingDeltaTextLoss: {
    color: colors.red,
  },
  expiryText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  courtName: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  confirmedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  scoresSection: {
    marginTop: spacing.sm,
  },
  scoresTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gameScoreItem: {
    backgroundColor: colors.cardSecondary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gameLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  gameScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  confirmButtonText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '600',
  },
  contestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contestButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 3,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
