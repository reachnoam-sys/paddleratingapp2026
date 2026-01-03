import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Info, X } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

// Helper to convert Elo to display rating
function eloToRating(elo: number): string {
  const rating = 2.0 + (elo - 800) * (5.5 - 2.0) / (2000 - 800);
  return Math.max(2.0, Math.min(5.5, rating)).toFixed(1);
}

interface MatchHistory {
  opponentName: string;
  wins: number;
  losses: number;
}

interface MatchReadyCardProps {
  teamA: Player[];
  teamB: Player[];
  onCancelMatch?: () => void;
  onForfeit?: () => void;
  onSubmitScore?: () => void;
  isLastGame?: boolean;
  isNewMatch?: boolean;
  matchHistory?: MatchHistory[];
}

// Compute match difficulty label based on rating difference
function getMatchDifficulty(teamAAvg: number, teamBAvg: number): { label: string; color: string } {
  const diff = teamAAvg - teamBAvg;
  const absDiff = Math.abs(diff);

  if (absDiff < 50) {
    return { label: 'Even match', color: colors.accent };
  } else if (absDiff < 100) {
    return diff > 0
      ? { label: 'Slight edge', color: '#4ade80' }
      : { label: 'Slight underdog', color: '#fbbf24' };
  } else if (absDiff < 200) {
    return diff > 0
      ? { label: 'Clear favorite', color: '#22c55e' }
      : { label: 'Tough matchup', color: '#f97316' };
  } else {
    return diff > 0
      ? { label: 'Heavy favorite', color: '#16a34a' }
      : { label: 'Major underdog', color: '#ef4444' };
  }
}

export function MatchReadyCard({
  teamA,
  teamB,
  onCancelMatch,
  onForfeit,
  onSubmitScore,
  isLastGame = false,
  isNewMatch = true,
  matchHistory = [],
}: MatchReadyCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const teamANames = teamA.map(p => p.name.split(' ')[0]).join(' + ');
  const teamBNames = teamB.map(p => p.name.split(' ')[0]).join(' + ');

  // Calculate team averages
  const teamAAvgElo = teamA.reduce((sum, p) => sum + p.elo, 0) / teamA.length;
  const teamBAvgElo = teamB.reduce((sum, p) => sum + p.elo, 0) / teamB.length;
  const teamAAvgRating = eloToRating(teamAAvgElo);
  const teamBAvgRating = eloToRating(teamBAvgElo);
  const matchDifficulty = getMatchDifficulty(teamAAvgElo, teamBAvgElo);

  // Animation values
  const borderGlow = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const vsOpacity = useSharedValue(0);
  const detailsModalTranslateY = useSharedValue(0);

  useEffect(() => {
    if (isNewMatch && !hasAnimated) {
      cardScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.1)) });
      vsOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
      borderGlow.value = withDelay(
        400,
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 600 })
        )
      );
      setHasAnimated(true);
    }
  }, [isNewMatch, hasAnimated]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
    ],
    borderColor: `rgba(57, 255, 20, ${borderGlow.value * 0.6})`,
    shadowColor: colors.accent,
    shadowOpacity: borderGlow.value * 0.4,
    shadowRadius: borderGlow.value * 20,
  }));

  const animatedVsStyle = useAnimatedStyle(() => ({
    opacity: vsOpacity.value,
  }));

  // Swipe down gesture for details modal
  const detailsPanGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        detailsModalTranslateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(setDetailsOpen)(false);
      }
      detailsModalTranslateY.value = withTiming(0, { duration: 200 });
    });

  const animatedDetailsModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: detailsModalTranslateY.value }],
  }));

  return (
    <>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Animated.View
                style={[styles.statusDot, isLastGame && styles.statusDotCompleted]}
                entering={FadeIn.delay(500).duration(300)}
              />
              <Animated.Text
                style={styles.title}
                entering={FadeIn.delay(500).duration(300)}
              >
                {isLastGame ? 'Last game' : 'Match ready'}
              </Animated.Text>
            </View>
            <Pressable
              style={styles.infoButton}
              onPress={() => setDetailsOpen(true)}
              hitSlop={8}
            >
              <Info size={16} color={colors.textSubtle} />
            </Pressable>
          </View>

          <View style={styles.teamsRow}>
            <View style={styles.teamAvatars}>
              {teamA.slice(0, 2).map((player, idx) => (
                <Animated.Image
                  key={player.id}
                  source={{ uri: player.avatar }}
                  style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
                  entering={isNewMatch && !hasAnimated ? FadeInLeft.delay(idx * 100).duration(400) : undefined}
                />
              ))}
            </View>
            <Animated.Text style={[styles.vsText, animatedVsStyle]}>vs</Animated.Text>
            <View style={styles.teamAvatars}>
              {teamB.slice(0, 2).map((player, idx) => (
                <Animated.Image
                  key={player.id}
                  source={{ uri: player.avatar }}
                  style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
                  entering={isNewMatch && !hasAnimated ? FadeInRight.delay(idx * 100 + 150).duration(400) : undefined}
                />
              ))}
            </View>
          </View>

          <Animated.Text
            style={styles.matchup}
            entering={FadeIn.delay(400).duration(300)}
          >
            {teamANames} vs {teamBNames}
          </Animated.Text>
          {!isLastGame && (
            <Animated.Text
              style={styles.helper}
              entering={FadeIn.delay(600).duration(300)}
            >
              Head to an open court
            </Animated.Text>
          )}
        </Animated.View>

      {/* Match Details Modal */}
      <Modal
        visible={detailsOpen}
        transparent
        animationType="none"
        onRequestClose={() => setDetailsOpen(false)}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setDetailsOpen(false)} />
          <GestureDetector gesture={detailsPanGesture}>
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={[styles.modalContent, animatedDetailsModalStyle]}
            >
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Match details</Text>
                <Pressable onPress={() => setDetailsOpen(false)} hitSlop={8}>
                  <X size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.ratingsSection}>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Your team</Text>
                  <Text style={styles.ratingValue}>{teamAAvgRating} avg</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Opponents</Text>
                  <Text style={styles.ratingValue}>{teamBAvgRating} avg</Text>
                </View>
              </View>

              <View style={styles.difficultySection}>
                <View style={[styles.difficultyBadge, { backgroundColor: `${matchDifficulty.color}20` }]}>
                  <View style={[styles.difficultyDot, { backgroundColor: matchDifficulty.color }]} />
                  <Text style={[styles.difficultyText, { color: matchDifficulty.color }]}>
                    {matchDifficulty.label}
                  </Text>
                </View>
              </View>

              {matchHistory.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>Past matches</Text>
                  {matchHistory.map((history, idx) => (
                    <View key={idx} style={styles.historyRow}>
                      <Text style={styles.historyText}>
                        You've played {history.opponentName} before
                      </Text>
                      <Text style={styles.historyRecord}>
                        ({history.wins}–{history.losses})
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {matchHistory.length === 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historyEmpty}>First time playing these opponents</Text>
                </View>
              )}
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoButton: {
    padding: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textSecondary,
  },
  statusDotCompleted: {
    backgroundColor: colors.accent,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  teamAvatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  matchup: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + 20,
    minHeight: 280,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  ratingsSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  ratingLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  ratingValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  difficultySection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historySection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  historySectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  historyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  historyRecord: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  historyEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
