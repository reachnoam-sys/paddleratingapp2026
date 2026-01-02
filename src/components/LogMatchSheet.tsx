import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  FadeInDown,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, spacing, borderRadius } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 440;
const DISMISS_THRESHOLD = 150;

interface GameScore {
  teamAScore: number;
  teamBScore: number;
}

interface LogMatchSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (games: GameScore[]) => void;
  teamALabel?: string;
  teamBLabel?: string;
  matchSubtitle?: string;
}

type GameTarget = 11 | 15 | 21;

// Custom hook for long-press acceleration
function useLongPressAcceleration(
  onIncrement: () => void,
  initialDelay = 500,
  fastInterval = 50
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
    // Initial tap
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
}: LogMatchSheetProps) {
  const [gameTarget, setGameTarget] = useState<GameTarget>(11);
  const [games, setGames] = useState<GameScore[]>([{ teamAScore: 0, teamBScore: 0 }]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  // Animation values
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const currentGame = games[currentGameIndex];

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
    setGameTarget(11);
    setGames([{ teamAScore: 0, teamBScore: 0 }]);
    setCurrentGameIndex(0);
  };

  const handleClose = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, () => {
      runOnJS(resetState)();
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const handleSave = () => {
    // Filter out games with 0-0 scores
    const validGames = games.filter(g => g.teamAScore > 0 || g.teamBScore > 0);
    if (validGames.length > 0) {
      onComplete(validGames);
    }
    handleClose();
  };

  // Gesture handler for dragging the sheet
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // Only allow dragging down (positive Y)
      const newY = context.value.y + event.translationY;
      translateY.value = Math.max(0, newY);

      // Update backdrop opacity based on sheet position
      const progress = Math.max(0, Math.min(1, newY / SHEET_HEIGHT));
      backdropOpacity.value = 1 - progress;
    })
    .onEnd((event) => {
      // Dismiss if dragged past threshold or with enough velocity
      if (translateY.value > DISMISS_THRESHOLD || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        // Snap back to open position
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 300,
          mass: 0.8,
        });
        backdropOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  // Get max allowed score for a team given opponent's score
  const getMaxScore = useCallback((opponentScore: number): number => {
    // If opponent is at or above target - 1, we might need to go higher (deuce)
    if (opponentScore >= gameTarget - 1) {
      // Can go up to opponent + 2 (win by 2)
      return opponentScore + 2;
    }
    // Otherwise, can only go up to target
    return gameTarget;
  }, [gameTarget]);

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
      setGames([...games, { teamAScore: 0, teamBScore: 0 }]);
      setCurrentGameIndex(games.length);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const selectGame = (index: number) => {
    setCurrentGameIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  // Check if current game has a valid score entered
  const hasValidCurrentScore = currentGame.teamAScore > 0 || currentGame.teamBScore > 0;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
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
            {matchSubtitle && (
              <Text style={styles.subtitle}>{matchSubtitle}</Text>
            )}
          </View>

          {/* Game Tabs - show logged games */}
          {games.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gameTabsContainer}
              contentContainerStyle={styles.gameTabsContent}
            >
              {games.map((game, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.gameTab,
                    currentGameIndex === index && styles.gameTabActive,
                  ]}
                  onPress={() => selectGame(index)}
                  onLongPress={() => removeGame(index)}
                >
                  <Text style={[
                    styles.gameTabText,
                    currentGameIndex === index && styles.gameTabTextActive,
                  ]}>
                    {game.teamAScore > 0 || game.teamBScore > 0
                      ? `${game.teamAScore}-${game.teamBScore}`
                      : `G${index + 1}`
                    }
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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

          {/* Game Target Selector - moved below score input */}
          <View style={styles.targetRow}>
            {([11, 15, 21] as GameTarget[]).map((target) => (
              <Pressable
                key={target}
                style={[
                  styles.targetPill,
                  gameTarget === target && styles.targetPillActive,
                ]}
                onPress={() => {
                  setGameTarget(target);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.targetPillText,
                    gameTarget === target && styles.targetPillTextActive,
                  ]}
                >
                  to {target}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Add Game Button - only show if current game has score and under 5 games */}
          {hasValidCurrentScore && games.length < 5 && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Pressable style={styles.addGameButton} onPress={addGame}>
                <Text style={styles.addGameButtonText}>+ Add another game</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSave();
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={handleClose}>
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
    paddingBottom: 34,
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
    paddingVertical: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  gameTabsContainer: {
    maxHeight: 44,
    marginBottom: spacing.lg,
  },
  gameTabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  gameTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    minWidth: 48,
    alignItems: 'center',
  },
  gameTabActive: {
    backgroundColor: colors.whiteMedium,
  },
  gameTabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  gameTabTextActive: {
    color: colors.white,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  scoreColumn: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonText: {
    color: colors.textSecondary,
    fontSize: 24,
    fontWeight: '300',
  },
  scoreValue: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  targetPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  targetPillActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
  },
  targetPillText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  targetPillTextActive: {
    color: colors.accent,
  },
  addGameButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  addGameButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
});
