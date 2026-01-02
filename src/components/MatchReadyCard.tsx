import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Keyboard, Platform, ScrollView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Info, X, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

// Common score presets by game type
const COMMON_SCORES: Record<number, Array<[number, number]>> = {
  11: [[11, 7], [11, 9], [11, 5]],
  15: [[15, 11], [15, 13], [15, 9]],
  21: [[21, 15], [21, 18], [21, 12]],
};

// Default game target
const DEFAULT_GAME_TO = 11;

// Wheel picker item height
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_ITEMS = 5;

// Helper to convert Elo to DUPR-style rating
function eloToDupr(elo: number): string {
  const dupr = 2.0 + (elo - 800) * (5.5 - 2.0) / (2000 - 800);
  return Math.max(2.0, Math.min(5.5, dupr)).toFixed(1);
}

interface MatchHistory {
  opponentName: string;
  wins: number;
  losses: number;
}

// Game score type for multi-game support
interface GameScore {
  teamA: number | null;
  teamB: number | null;
}

interface MatchReadyCardProps {
  teamA: Player[];
  teamB: Player[];
  onCancelMatch?: () => void;
  onForfeit?: () => void;
  onSubmitScore?: () => void;
  onSaveScore?: (teamAScore: number, teamBScore: number) => void;
  onSaveMultipleScores?: (games: Array<{ teamA: number; teamB: number }>) => void;
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
  onSaveScore,
  onSaveMultipleScores,
  isLastGame = false,
  isNewMatch = true,
  matchHistory = [],
}: MatchReadyCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scoreSheetOpen, setScoreSheetOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [gameTo, setGameTo] = useState<number>(DEFAULT_GAME_TO);
  const [hasInteracted, setHasInteracted] = useState<Record<string, boolean>>({});

  // Multi-game support
  const [gameCount, setGameCount] = useState(1);
  const [games, setGames] = useState<GameScore[]>([{ teamA: null, teamB: null }]);

  // Wheel picker state
  const [wheelPickerOpen, setWheelPickerOpen] = useState(false);
  const [wheelPickerGameIndex, setWheelPickerGameIndex] = useState(0);
  const [wheelPickerTeam, setWheelPickerTeam] = useState<'A' | 'B'>('A');
  const [wheelPickerValue, setWheelPickerValue] = useState(0);
  const wheelScrollRef = useRef<ScrollView>(null);
  const lastHapticValue = useRef<number>(-1);

  const inputRef = useRef<TextInput>(null);

  const teamANames = teamA.map(p => p.name.split(' ')[0]).join(' + ');
  const teamBNames = teamB.map(p => p.name.split(' ')[0]).join(' + ');

  // Calculate team averages
  const teamAAvgElo = teamA.reduce((sum, p) => sum + p.elo, 0) / teamA.length;
  const teamBAvgElo = teamB.reduce((sum, p) => sum + p.elo, 0) / teamB.length;
  const teamAAvgDupr = eloToDupr(teamAAvgElo);
  const teamBAvgDupr = eloToDupr(teamBAvgElo);
  const matchDifficulty = getMatchDifficulty(teamAAvgElo, teamBAvgElo);

  // Animation values
  const borderGlow = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const cardLift = useSharedValue(0);
  const vsOpacity = useSharedValue(0);
  const detailsModalTranslateY = useSharedValue(0);
  const scoreSheetTranslateY = useSharedValue(0);

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

  // Card lift animation when opening score sheet
  const liftCard = () => {
    cardLift.value = withSpring(-8, { damping: 15, stiffness: 200 });
  };

  const resetCardLift = () => {
    cardLift.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  const handleOpenScoreSheet = () => {
    liftCard();
    setScoreSheetOpen(true);
  };

  const handleCloseScoreSheet = () => {
    resetCardLift();
    setScoreSheetOpen(false);
    setGameTo(DEFAULT_GAME_TO);
    setHasInteracted({});
    setGameCount(1);
    setGames([{ teamA: null, teamB: null }]);
    setWheelPickerOpen(false);
    Keyboard.dismiss();
  };

  // Validate a single game score
  const isGameValid = (game: GameScore): boolean => {
    const a = game.teamA ?? 0;
    const b = game.teamB ?? 0;
    if (a === 0 && b === 0) return false;
    if (a === b) return false;
    if (a > gameTo || b > gameTo) return false;
    return true;
  };

  // Validate all games for save button
  const isScoreValid = () => {
    return games.slice(0, gameCount).every(isGameValid);
  };

  const handleSaveScore = () => {
    if (!isScoreValid()) return;

    const validGames = games.slice(0, gameCount).map(g => ({
      teamA: g.teamA ?? 0,
      teamB: g.teamB ?? 0,
    }));

    if (gameCount === 1 && onSaveScore) {
      onSaveScore(validGames[0].teamA, validGames[0].teamB);
    } else if (onSaveMultipleScores) {
      onSaveMultipleScores(validGames);
    } else if (onSaveScore) {
      // Fallback: save first game only
      onSaveScore(validGames[0].teamA, validGames[0].teamB);
    }
    handleCloseScoreSheet();
  };

  // Clamp score to gameTo
  const clampScore = (score: number): number => {
    return Math.max(0, Math.min(gameTo, score));
  };

  // Handle score change with haptic and animation trigger
  const handleScoreChange = (gameIndex: number, team: 'A' | 'B', newScore: number) => {
    const clampedScore = clampScore(newScore);
    const interactionKey = `${gameIndex}-${team}`;
    const currentGame = games[gameIndex];
    const wasUnset = team === 'A' ? currentGame?.teamA === null : currentGame?.teamB === null;

    if (wasUnset || !hasInteracted[interactionKey]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHasInteracted(prev => ({ ...prev, [interactionKey]: true }));
    }

    setGames(prev => {
      const updated = [...prev];
      if (!updated[gameIndex]) {
        updated[gameIndex] = { teamA: null, teamB: null };
      }
      if (team === 'A') {
        updated[gameIndex] = { ...updated[gameIndex], teamA: clampedScore };
      } else {
        updated[gameIndex] = { ...updated[gameIndex], teamB: clampedScore };
      }
      return updated;
    });
  };

  // Handle preset selection
  const handlePresetSelect = (preset: number) => {
    if (preset === gameTo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGameTo(preset);
    // Clamp existing scores if needed
    setGames(prev => prev.map(game => ({
      teamA: game.teamA !== null ? Math.min(game.teamA, preset) : null,
      teamB: game.teamB !== null ? Math.min(game.teamB, preset) : null,
    })));
  };

  // Handle common score chip tap
  const handleCommonScoreTap = (gameIndex: number, youScore: number, themScore: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGames(prev => {
      const updated = [...prev];
      updated[gameIndex] = { teamA: youScore, teamB: themScore };
      return updated;
    });
    const keyA = `${gameIndex}-A`;
    const keyB = `${gameIndex}-B`;
    setHasInteracted(prev => ({ ...prev, [keyA]: true, [keyB]: true }));
  };

  // Handle tapping score to open wheel picker
  const handleScoreTap = (gameIndex: number, team: 'A' | 'B') => {
    const currentGame = games[gameIndex];
    const currentScore = team === 'A' ? currentGame?.teamA : currentGame?.teamB;
    setWheelPickerGameIndex(gameIndex);
    setWheelPickerTeam(team);
    setWheelPickerValue(currentScore ?? 0);
    lastHapticValue.current = currentScore ?? 0;
    setWheelPickerOpen(true);

    // Scroll to current value after modal opens
    setTimeout(() => {
      const offset = (currentScore ?? 0) * WHEEL_ITEM_HEIGHT;
      wheelScrollRef.current?.scrollTo({ y: offset, animated: false });
    }, 100);
  };

  // Handle wheel picker scroll
  const handleWheelScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / WHEEL_ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(gameTo, index));

    if (clampedIndex !== lastHapticValue.current) {
      Haptics.selectionAsync();
      lastHapticValue.current = clampedIndex;
      setWheelPickerValue(clampedIndex);
    }
  };

  // Handle wheel picker done
  const handleWheelPickerDone = () => {
    handleScoreChange(wheelPickerGameIndex, wheelPickerTeam, wheelPickerValue);
    setWheelPickerOpen(false);
  };

  // Handle adding another game
  const handleAddGame = () => {
    if (gameCount < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGameCount(prev => prev + 1);
      setGames(prev => {
        const updated = [...prev];
        if (!updated[gameCount]) {
          updated[gameCount] = { teamA: null, teamB: null };
        }
        return updated;
      });
    }
  };

  // Handle game count selection
  const handleGameCountSelect = (count: number) => {
    if (count === gameCount) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGameCount(count);
    // Ensure we have enough game slots
    setGames(prev => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push({ teamA: null, teamB: null });
      }
      return updated;
    });
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardLift.value },
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

  // Swipe down gesture for score sheet
  const scoreSheetPanGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        scoreSheetTranslateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(handleCloseScoreSheet)();
      }
      scoreSheetTranslateY.value = withTiming(0, { duration: 200 });
    });

  const animatedDetailsModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: detailsModalTranslateY.value }],
  }));

  const animatedScoreSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scoreSheetTranslateY.value }],
  }));

  // Long press gesture for card with haptic feedback
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onEnd(() => {
      runOnJS(handleOpenScoreSheet)();
    });

  return (
    <>
      <GestureDetector gesture={longPressGesture}>
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
      </GestureDetector>

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
                  <Text style={styles.ratingValue}>{teamAAvgDupr} avg</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Opponents</Text>
                  <Text style={styles.ratingValue}>{teamBAvgDupr} avg</Text>
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

      {/* Score Logging Bottom Sheet */}
      <Modal
        visible={scoreSheetOpen}
        transparent
        animationType="none"
        onRequestClose={handleCloseScoreSheet}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseScoreSheet} />
          <GestureDetector gesture={scoreSheetPanGesture}>
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={[styles.scoreSheetContent, animatedScoreSheetStyle]}
            >
              <View style={styles.modalHandle} />

              {/* Header */}
              <View style={styles.scoreSheetHeader}>
                <Text style={styles.scoreSheetTitle}>Log match</Text>
                <Text style={styles.scoreSheetSubtitle}>
                  {teamANames} vs {teamBNames}
                </Text>
              </View>

              {/* Game Count Selector */}
              <View style={styles.gameCountRow}>
                <Text style={styles.gameCountLabel}>Games</Text>
                <View style={styles.gameCountSegments}>
                  {[1, 2, 3].map((count) => (
                    <Pressable
                      key={count}
                      style={[
                        styles.gameCountSegment,
                        gameCount === count && styles.gameCountSegmentSelected,
                      ]}
                      onPress={() => handleGameCountSelect(count)}
                    >
                      <Text
                        style={[
                          styles.gameCountText,
                          gameCount === count && styles.gameCountTextSelected,
                        ]}
                      >
                        {count}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Game Presets - always visible with default selection */}
              <View style={styles.presetsRow}>
                {[11, 15, 21].map((preset) => (
                  <Pressable
                    key={preset}
                    style={[
                      styles.presetButton,
                      gameTo === preset && styles.presetButtonSelected,
                    ]}
                    onPress={() => handlePresetSelect(preset)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        gameTo === preset && styles.presetTextSelected,
                      ]}
                    >
                      to {preset}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Score Rows for each game */}
              {Array.from({ length: gameCount }).map((_, gameIndex) => {
                const game = games[gameIndex] || { teamA: null, teamB: null };
                const keyA = `${gameIndex}-A`;
                const keyB = `${gameIndex}-B`;

                return (
                  <Animated.View
                    key={gameIndex}
                    entering={gameIndex > 0 ? FadeIn.duration(200) : undefined}
                    style={styles.gameRow}
                  >
                    {gameCount > 1 && (
                      <Text style={styles.gameRowLabel}>Game {gameIndex + 1}</Text>
                    )}
                    <View style={styles.scoreInputContainer}>
                      {/* Team A Score */}
                      <View style={styles.teamScoreSection}>
                        {gameIndex === 0 && <Text style={styles.teamLabel}>You</Text>}
                        <View style={styles.scoreControls}>
                          <Pressable
                            style={styles.scoreButton}
                            onPress={() => handleScoreChange(gameIndex, 'A', (game.teamA ?? 0) - 1)}
                          >
                            <Minus size={20} color={colors.white} />
                          </Pressable>
                          <Pressable onPress={() => handleScoreTap(gameIndex, 'A')}>
                            {game.teamA === null ? (
                              <Text style={styles.scorePlaceholder}>—</Text>
                            ) : hasInteracted[keyA] ? (
                              <Animated.Text
                                entering={ZoomIn.duration(200)}
                                style={styles.scoreValue}
                              >
                                {game.teamA}
                              </Animated.Text>
                            ) : (
                              <Text style={styles.scoreValue}>{game.teamA}</Text>
                            )}
                          </Pressable>
                          <Pressable
                            style={styles.scoreButton}
                            onPress={() => handleScoreChange(gameIndex, 'A', (game.teamA ?? 0) + 1)}
                          >
                            <Plus size={20} color={colors.white} />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.scoreDivider}>
                        <Text style={styles.scoreDividerText}>–</Text>
                      </View>

                      {/* Team B Score */}
                      <View style={styles.teamScoreSection}>
                        {gameIndex === 0 && <Text style={styles.teamLabel}>Them</Text>}
                        <View style={styles.scoreControls}>
                          <Pressable
                            style={styles.scoreButton}
                            onPress={() => handleScoreChange(gameIndex, 'B', (game.teamB ?? 0) - 1)}
                          >
                            <Minus size={20} color={colors.white} />
                          </Pressable>
                          <Pressable onPress={() => handleScoreTap(gameIndex, 'B')}>
                            {game.teamB === null ? (
                              <Text style={styles.scorePlaceholder}>—</Text>
                            ) : hasInteracted[keyB] ? (
                              <Animated.Text
                                entering={ZoomIn.duration(200)}
                                style={styles.scoreValue}
                              >
                                {game.teamB}
                              </Animated.Text>
                            ) : (
                              <Text style={styles.scoreValue}>{game.teamB}</Text>
                            )}
                          </Pressable>
                          <Pressable
                            style={styles.scoreButton}
                            onPress={() => handleScoreChange(gameIndex, 'B', (game.teamB ?? 0) + 1)}
                          >
                            <Plus size={20} color={colors.white} />
                          </Pressable>
                        </View>
                      </View>
                    </View>

                    {/* Quick scores for this game - always visible with crossfade */}
                    <Animated.View
                      key={`quick-${gameTo}`}
                      entering={FadeIn.duration(150)}
                      exiting={FadeOut.duration(100)}
                      style={styles.quickScoresContainer}
                    >
                      <Text style={styles.quickScoresLabel}>Quick</Text>
                      <View style={styles.commonScoresRow}>
                        {COMMON_SCORES[gameTo]?.map(([you, them], idx) => (
                          <Pressable
                            key={`${gameTo}-${idx}`}
                            style={styles.commonScoreChip}
                            onPress={() => handleCommonScoreTap(gameIndex, you, them)}
                          >
                            <Text style={styles.commonScoreText}>
                              {you}–{them}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </Animated.View>
                  </Animated.View>
                );
              })}

              {/* Actions */}
              <View style={styles.scoreSheetActions}>
                <Pressable
                  style={[
                    styles.saveButton,
                    !isScoreValid() && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveScore}
                  disabled={!isScoreValid()}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      !isScoreValid() && styles.saveButtonTextDisabled,
                    ]}
                  >
                    Save{gameCount > 1 ? ` ${gameCount} games` : ''}
                  </Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={handleCloseScoreSheet}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </Modal>

      {/* Wheel Picker Modal */}
      <Modal
        visible={wheelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWheelPickerOpen(false)}
      >
        <View style={styles.wheelPickerOverlay}>
          <Pressable
            style={styles.wheelPickerBackdrop}
            onPress={() => setWheelPickerOpen(false)}
          />
          <Animated.View
            entering={FadeInUp.duration(200)}
            style={styles.wheelPickerContainer}
          >
            <View style={styles.wheelPickerHeader}>
              <Pressable onPress={() => setWheelPickerOpen(false)}>
                <Text style={styles.wheelPickerCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.wheelPickerTitle}>
                {wheelPickerTeam === 'A' ? 'You' : 'Them'}
              </Text>
              <Pressable onPress={handleWheelPickerDone}>
                <Text style={styles.wheelPickerDone}>Done</Text>
              </Pressable>
            </View>

            <View style={styles.wheelPickerContent}>
              {/* Selection indicator */}
              <View style={styles.wheelPickerIndicator} />

              <ScrollView
                ref={wheelScrollRef}
                style={styles.wheelScroll}
                contentContainerStyle={{
                  paddingVertical: WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ITEMS / 2),
                }}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                onScroll={handleWheelScroll}
                scrollEventThrottle={16}
              >
                {Array.from({ length: gameTo + 1 }).map((_, i) => (
                  <View key={i} style={styles.wheelPickerItem}>
                    <Text
                      style={[
                        styles.wheelPickerItemText,
                        wheelPickerValue === i && styles.wheelPickerItemTextSelected,
                      ]}
                    >
                      {i}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
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
  // Score Sheet styles
  scoreSheetContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + 20,
    maxHeight: '85%',
  },
  scoreSheetHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreSheetTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  scoreSheetSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  // Game count selector
  gameCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  gameCountLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  gameCountSegments: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  gameCountSegment: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  gameCountSegmentSelected: {
    backgroundColor: colors.card,
  },
  gameCountText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  gameCountTextSelected: {
    color: colors.white,
  },
  // Game row container
  gameRow: {
    marginBottom: spacing.md,
  },
  gameRowLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamScoreSection: {
    alignItems: 'center',
    flex: 1,
  },
  teamLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  scoreValue: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
  scorePlaceholder: {
    color: colors.textMuted,
    fontSize: 40,
    fontWeight: '300',
    minWidth: 56,
    textAlign: 'center',
  },
  scoreDivider: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
  },
  scoreDividerText: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: '300',
  },
  // Preset row - reduced visual weight
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  presetButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  presetText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  presetTextSelected: {
    color: colors.accent,
  },
  // Quick scores container
  quickScoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickScoresLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Common score chips
  commonScoresRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  commonScoreChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  commonScoreText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  scoreSheetActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: colors.black,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  // Wheel Picker styles
  wheelPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  wheelPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  wheelPickerContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xxl,
  },
  wheelPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  wheelPickerCancel: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  wheelPickerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  wheelPickerDone: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  wheelPickerContent: {
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
    position: 'relative',
  },
  wheelPickerIndicator: {
    position: 'absolute',
    top: WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ITEMS / 2),
    left: spacing.xl,
    right: spacing.xl,
    height: WHEEL_ITEM_HEIGHT,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    zIndex: 0,
  },
  wheelScroll: {
    zIndex: 1,
  },
  wheelPickerItem: {
    height: WHEEL_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelPickerItemText: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '500',
  },
  wheelPickerItemTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});
