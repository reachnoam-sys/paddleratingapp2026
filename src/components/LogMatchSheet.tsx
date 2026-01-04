import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 460;
const DISMISS_THRESHOLD = 150;

// Strong type for game scores - ensures no blank/invalid chips
interface GameScore {
  id: string;
  teamAScore: number;
  teamBScore: number;
}

// Helper to create a valid game score
const createGameScore = (): GameScore => ({
  id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  teamAScore: 0,
  teamBScore: 0,
});

// Validate a game score object
const isValidGameScore = (game: unknown): game is GameScore => {
  if (!game || typeof game !== 'object') return false;
  const g = game as GameScore;
  return (
    typeof g.id === 'string' &&
    typeof g.teamAScore === 'number' &&
    typeof g.teamBScore === 'number'
  );
};

// Swipe-to-delete game chip (Robinhood style)
interface GameChipProps {
  game: GameScore;
  index: number;
  isActive: boolean;
  isMostRecent: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = 60;

function GameChip({
  game,
  index,
  isActive,
  isMostRecent,
  canDelete,
  onSelect,
  onDelete,
}: GameChipProps) {
  const hasScore = game.teamAScore > 0 || game.teamBScore > 0;

  // Animation values - each chip maintains its own isolated state
  const translateX = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  const handleSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  }, [onSelect]);

  const handleDelete = useCallback(() => {
    if (isDeleting.value) return; // Prevent double deletion
    isDeleting.value = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete();
  }, [onDelete, isDeleting]);

  // Tap gesture for selection
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      'worklet';
      if (isDeleting.value) return;
      runOnJS(handleSelect)();
    });

  // Pan gesture for swipe-to-delete
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      'worklet';
      if (!canDelete || !hasScore || isDeleting.value) return;
      // Only allow left swipe (negative)
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -100);
      }
    })
    .onEnd((event) => {
      'worklet';
      if (!canDelete || !hasScore || isDeleting.value) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        return;
      }

      if (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -500) {
        // Swipe to delete - animate out first
        translateX.value = withTiming(-200, { duration: 150 });
        runOnJS(handleDelete)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  const animatedChipStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Delete indicator behind chip
  const deleteIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={gameChipStyles.wrapper}>
      {/* Delete indicator behind */}
      {canDelete && hasScore && (
        <Animated.View style={[gameChipStyles.deleteIndicator, deleteIndicatorStyle]}>
          <Trash2 size={14} color={colors.white} />
        </Animated.View>
      )}

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            gameChipStyles.chip,
            isActive && gameChipStyles.chipActive,
            hasScore && gameChipStyles.chipRecorded,
            isMostRecent && hasScore && gameChipStyles.chipMostRecent,
            animatedChipStyle,
          ]}
        >
          <Text style={[
            gameChipStyles.chipText,
            isActive && gameChipStyles.chipTextActive,
            isMostRecent && hasScore && gameChipStyles.chipTextMostRecent,
          ]}>
            {hasScore ? `${game.teamAScore}–${game.teamBScore}` : `G${index + 1}`}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const gameChipStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'visible',
    height: 44,
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg + 4,
    backgroundColor: colors.cardSecondary,
    borderRadius: borderRadius.lg,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chipActive: {
    backgroundColor: colors.whiteMedium,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  chipRecorded: {
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  chipMostRecent: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextMostRecent: {
    color: colors.accent,
  },
  // Delete indicator shown behind chip when swiping (Robinhood red style)
  deleteIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
    backgroundColor: '#FF3B30',
    borderRadius: borderRadius.lg,
  },
});

// Game target is fixed at 11 with win-by-2 rules
const GAME_TARGET = 11;

interface LogMatchSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (games: GameScore[]) => void;
  teamALabel?: string;
  teamBLabel?: string;
  matchSubtitle?: string;
  matchType?: 'singles' | 'doubles';
}

// Custom hook for long-press acceleration with haptics
function useLongPressAcceleration(
  onIncrement: () => void,
  initialDelay = 400,
  fastInterval = 60
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPressingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPressingRef.current = false;
  }, []);

  const handlePressIn = useCallback(() => {
    isPressingRef.current = true;
    // Initial tap with haptic
    onIncrement();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start accelerated incrementing after delay
    timeoutRef.current = setTimeout(() => {
      if (!isPressingRef.current) return;

      // Trigger haptic for acceleration start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      intervalRef.current = setInterval(() => {
        if (!isPressingRef.current) {
          clearTimers();
          return;
        }
        onIncrement();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, fastInterval);
    }, initialDelay);
  }, [onIncrement, initialDelay, fastInterval, clearTimers]);

  const handlePressOut = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return { handlePressIn, handlePressOut };
}

export function LogMatchSheet({
  visible,
  onClose,
  onComplete,
  teamALabel = 'You',
  teamBLabel = 'Them',
  matchSubtitle,
  matchType = 'singles',
}: LogMatchSheetProps) {
  const [games, setGames] = useState<GameScore[]>([createGameScore()]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Animation values
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const saveButtonScale = useSharedValue(1);


  const currentGame = games[currentGameIndex];

  // Find the most recent recorded game index
  const mostRecentRecordedIndex = games.reduce((latest, game, index) => {
    const hasScore = game.teamAScore > 0 || game.teamBScore > 0;
    return hasScore ? index : latest;
  }, -1);

  // Animate sheet in/out when visibility changes
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const resetState = () => {
    setGames([createGameScore()]);
    setCurrentGameIndex(0);
    setIsSaving(false);
  };

  // Dismiss without resetting - data persists for when user returns
  const handleDismiss = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  // Close and reset - used for cancel button
  const handleCancel = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, () => {
      runOnJS(resetState)();
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const handleSave = () => {
    const validGames = games.filter(g => g.teamAScore > 0 || g.teamBScore > 0);
    if (validGames.length === 0) return;

    // Show saving state
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate save button
    saveButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Brief loading state then complete
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(validGames);
      // Don't reset immediately - let the parent handle transition
      setTimeout(() => {
        resetState();
        onClose();
      }, 100);
    }, 600);
  };

  // Gesture handler for dragging the sheet
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      'worklet';
      const newY = context.value.y + event.translationY;
      translateY.value = Math.max(0, newY);
      const progress = Math.max(0, Math.min(1, newY / SHEET_HEIGHT));
      backdropOpacity.value = 1 - progress;
    })
    .onEnd((event) => {
      'worklet';
      if (translateY.value > DISMISS_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 300,
          mass: 0.8,
        });
        backdropOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  // Get max allowed score (clamped for realistic scores)
  // Uses fixed GAME_TARGET of 11 with win-by-2 rules
  const getMaxScore = useCallback((opponentScore: number): number => {
    if (opponentScore >= GAME_TARGET - 1) {
      // Deuce scenario - can go up to opponent + 2
      return Math.min(opponentScore + 2, 30); // Cap at 30 for realism
    }
    return GAME_TARGET;
  }, []);

  const incrementScoreA = useCallback(() => {
    setGames(prevGames => {
      const newGames = [...prevGames];
      const game = { ...newGames[currentGameIndex] };
      const maxAllowed = getMaxScore(game.teamBScore);
      if (game.teamAScore < maxAllowed) {
        game.teamAScore += 1;
      }
      newGames[currentGameIndex] = game;
      return newGames;
    });
  }, [currentGameIndex, getMaxScore]);

  const decrementScoreA = useCallback(() => {
    setGames(prevGames => {
      const newGames = [...prevGames];
      const game = { ...newGames[currentGameIndex] };
      game.teamAScore = Math.max(0, game.teamAScore - 1);
      newGames[currentGameIndex] = game;
      return newGames;
    });
  }, [currentGameIndex]);

  const incrementScoreB = useCallback(() => {
    setGames(prevGames => {
      const newGames = [...prevGames];
      const game = { ...newGames[currentGameIndex] };
      const maxAllowed = getMaxScore(game.teamAScore);
      if (game.teamBScore < maxAllowed) {
        game.teamBScore += 1;
      }
      newGames[currentGameIndex] = game;
      return newGames;
    });
  }, [currentGameIndex, getMaxScore]);

  const decrementScoreB = useCallback(() => {
    setGames(prevGames => {
      const newGames = [...prevGames];
      const game = { ...newGames[currentGameIndex] };
      game.teamBScore = Math.max(0, game.teamBScore - 1);
      newGames[currentGameIndex] = game;
      return newGames;
    });
  }, [currentGameIndex]);

  // Long press handlers for each button
  const incrementAPress = useLongPressAcceleration(incrementScoreA);
  const decrementAPress = useLongPressAcceleration(decrementScoreA);
  const incrementBPress = useLongPressAcceleration(incrementScoreB);
  const decrementBPress = useLongPressAcceleration(decrementScoreB);

  const addGame = () => {
    if (games.length < 5) {
      const newGame = createGameScore();
      setGames([...games, newGame]);
      setCurrentGameIndex(games.length);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const selectGame = (index: number) => {
    setCurrentGameIndex(index);
  };

  const removeGame = (index: number) => {
    if (games.length > 1) {
      const newGames = games.filter((_, i) => i !== index);
      setGames(newGames);
      if (currentGameIndex >= newGames.length) {
        setCurrentGameIndex(newGames.length - 1);
      } else if (currentGameIndex > index) {
        setCurrentGameIndex(currentGameIndex - 1);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Animated styles
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSaveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));


  // Check if current game is complete (to GAME_TARGET with win-by-2)
  const isGameComplete = (() => {
    const { teamAScore, teamBScore } = currentGame;
    const maxScore = Math.max(teamAScore, teamBScore);
    const minScore = Math.min(teamAScore, teamBScore);
    if (maxScore >= GAME_TARGET && maxScore - minScore >= 2) {
      return true;
    }
    return false;
  })();

  // Helper to check if a single game is complete (meets win conditions)
  const isGameCompleteScore = (g: GameScore): boolean => {
    const maxScore = Math.max(g.teamAScore, g.teamBScore);
    const minScore = Math.min(g.teamAScore, g.teamBScore);
    return maxScore >= GAME_TARGET && maxScore - minScore >= 2;
  };

  // Check if we have at least one game with scores entered
  const hasAnyScores = games.some(g => g.teamAScore > 0 || g.teamBScore > 0);

  // Check if ALL games with scores are complete (valid for saving)
  // A game is either empty (0-0) or complete - no partial/invalid scores allowed
  const allGamesValid = games.every(g => {
    const hasScore = g.teamAScore > 0 || g.teamBScore > 0;
    // If no score entered, it's fine (empty game)
    if (!hasScore) return true;
    // If has score, must be complete
    return isGameCompleteScore(g);
  });

  // Save is only enabled when we have scores AND all scored games are valid
  const canSave = hasAnyScores && allGamesValid;

  // Dynamic subtitle
  const contextSubtitle = matchSubtitle || `${matchType === 'singles' ? 'Singles' : 'Doubles'} · Rated match`;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, animatedSheetStyle]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log match</Text>
            <Text style={styles.contextSubtitle}>{contextSubtitle}</Text>
          </View>

          {/* Game Chips - show logged games (only when multiple games exist) */}
          {games.length > 1 && (
            <View style={styles.gameChipsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.gameChipsContainer}
                contentContainerStyle={styles.gameChipsContent}
              >
                {games.filter(isValidGameScore).map((game, index) => (
                  <GameChip
                    key={game.id}
                    game={game}
                    index={index}
                    isActive={currentGameIndex === index}
                    isMostRecent={index === mostRecentRecordedIndex}
                    canDelete={games.length > 1}
                    onSelect={() => selectGame(index)}
                    onDelete={() => removeGame(index)}
                  />
                ))}
              </ScrollView>
              <Text style={styles.swipeHint}>Swipe left to delete</Text>
            </View>
          )}

          {/* Score Input */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreColumn}>
              <Text style={styles.scoreLabel}>{teamALabel}</Text>
              <View style={styles.scoreControls}>
                <Pressable
                  style={styles.scoreButton}
                  onPressIn={decrementAPress.handlePressIn}
                  onPressOut={decrementAPress.handlePressOut}
                >
                  <Text style={styles.scoreButtonText}>−</Text>
                </Pressable>
                <Text style={styles.scoreValue}>{currentGame.teamAScore}</Text>
                <Pressable
                  style={styles.scoreButton}
                  onPressIn={incrementAPress.handlePressIn}
                  onPressOut={incrementAPress.handlePressOut}
                >
                  <Text style={styles.scoreButtonText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.scoreColumn}>
              <Text style={styles.scoreLabel}>{teamBLabel}</Text>
              <View style={styles.scoreControls}>
                <Pressable
                  style={styles.scoreButton}
                  onPressIn={decrementBPress.handlePressIn}
                  onPressOut={decrementBPress.handlePressOut}
                >
                  <Text style={styles.scoreButtonText}>−</Text>
                </Pressable>
                <Text style={styles.scoreValue}>{currentGame.teamBScore}</Text>
                <Pressable
                  style={styles.scoreButton}
                  onPressIn={incrementBPress.handlePressIn}
                  onPressOut={incrementBPress.handlePressOut}
                >
                  <Text style={styles.scoreButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>


          {/* Add Game - text only, low emphasis */}
          {games.length < 5 && (
            <Pressable
              style={styles.addGameButton}
              onPress={isGameComplete ? addGame : undefined}
              disabled={!isGameComplete}
            >
              <Text style={[
                styles.addGameButtonText,
                !isGameComplete && styles.addGameButtonTextDisabled,
              ]}>
                {isGameComplete ? 'Add another game' : 'Finish game to 11'}
              </Text>
            </Pressable>
          )}

          {/* Actions - Save is the only strong CTA */}
          <View style={styles.actions}>
            <Animated.View style={animatedSaveButtonStyle}>
              <Pressable
                style={[
                  styles.saveButton,
                  (!canSave || isSaving) && styles.saveButtonDisabled,
                ]}
                onPress={canSave && !isSaving ? handleSave : undefined}
                disabled={!canSave || isSaving}
              >
                {isSaving ? (
                  <View style={styles.savingContent}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
                    Save
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
  },
  contextSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  gameChipsWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  gameChipsContainer: {
    overflow: 'visible',
  },
  gameChipsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  swipeHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.6,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  scoreColumn: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreButtonText: {
    color: colors.textSecondary,
    fontSize: 28,
    fontWeight: '300',
  },
  scoreValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  // Add game button - accessible touch target
  addGameButton: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  addGameButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  addGameButtonTextDisabled: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: colors.white,
  },
  savingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});

// Grab handle pill component for triggering log match sheet
export function LogMatchGrabHandle({ onPress }: { onPress: () => void }) {
  const translateY = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const triggerLightHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const swipeGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      hasTriggeredHaptic.value = false;
    })
    .onUpdate((event) => {
      'worklet';
      if (event.translationY < 0) {
        const resistance = 0.4;
        const maxPull = -60;
        translateY.value = Math.max(maxPull, event.translationY * resistance);

        if (translateY.value < -20 && !hasTriggeredHaptic.value) {
          hasTriggeredHaptic.value = true;
          runOnJS(triggerLightHaptic)();
        }
      }
    })
    .onEnd((event) => {
      'worklet';
      hasTriggeredHaptic.value = false;

      if (event.translationY < -30 || event.velocityY < -200) {
        runOnJS(triggerHaptic)();
        runOnJS(onPress)();
      }
      translateY.value = withTiming(0, { duration: 150 });
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    width: interpolate(
      translateY.value,
      [-60, 0],
      [60, 40],
      Extrapolation.CLAMP
    ),
    backgroundColor: translateY.value < -30 ? colors.accent : colors.borderMedium,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [-40, 0],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const animatedHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [-40, -20],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[grabHandleStyles.container, animatedContainerStyle]}>
        <View style={grabHandleStyles.hitArea}>
          <Animated.View style={[grabHandleStyles.pill, animatedPillStyle]} />
          <Animated.Text style={[grabHandleStyles.label, animatedLabelStyle]}>
            Swipe up to log
          </Animated.Text>
          <Animated.Text style={[grabHandleStyles.releaseHint, animatedHintStyle]}>
            Release to open
          </Animated.Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const grabHandleStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    marginTop: spacing.lg,
  },
  hitArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl * 3,
    minHeight: 60,
  },
  pill: {
    width: 40,
    height: 5,
    backgroundColor: colors.borderMedium,
    borderRadius: 2.5,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  releaseHint: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    position: 'absolute',
    bottom: spacing.lg,
  },
});
