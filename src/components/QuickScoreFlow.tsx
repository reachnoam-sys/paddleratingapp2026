import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  FadeInUp,
} from 'react-native-reanimated';
import { X, Check, ChevronLeft } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

type GameResult = 'win' | 'loss' | null;

interface GameScore {
  result: GameResult;
  ourScore?: number;
  theirScore?: number;
}

interface QuickScoreFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (games: GameScore[]) => void;
  teamALabel?: string;
  teamBLabel?: string;
}

type FlowStep = 'count' | 'results' | 'details' | 'done';

export function QuickScoreFlow({
  visible,
  onClose,
  onComplete,
  teamALabel = 'We',
  teamBLabel = 'They',
}: QuickScoreFlowProps) {
  const [step, setStep] = useState<FlowStep>('count');
  const [gameCount, setGameCount] = useState<number>(0);
  const [currentGame, setCurrentGame] = useState(0);
  const [games, setGames] = useState<GameScore[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [tempScore, setTempScore] = useState({ our: '', their: '' });

  const resetFlow = () => {
    setStep('count');
    setGameCount(0);
    setCurrentGame(0);
    setGames([]);
    setShowDetails(false);
    setTempScore({ our: '', their: '' });
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleSelectCount = (count: number) => {
    setGameCount(count);
    setGames(Array(count).fill({ result: null }));
    setStep('results');
  };

  const handleGameResult = (result: GameResult) => {
    const newGames = [...games];
    newGames[currentGame] = {
      ...newGames[currentGame],
      result,
      ourScore: result === 'win' ? 11 : undefined,
      theirScore: result === 'loss' ? 11 : undefined,
    };
    setGames(newGames);

    if (currentGame < gameCount - 1) {
      setCurrentGame(currentGame + 1);
    } else {
      setStep('done');
    }
  };

  const handleAddDetails = () => {
    setShowDetails(true);
  };

  const handleSaveDetails = () => {
    const ourScore = parseInt(tempScore.our, 10);
    const theirScore = parseInt(tempScore.their, 10);

    if (!isNaN(ourScore) && !isNaN(theirScore)) {
      const newGames = [...games];
      newGames[currentGame] = {
        ...newGames[currentGame],
        ourScore,
        theirScore,
      };
      setGames(newGames);
    }
    setShowDetails(false);
    setTempScore({ our: '', their: '' });
  };

  const handleComplete = () => {
    onComplete(games);
    handleClose();
  };

  const handleBack = () => {
    if (showDetails) {
      setShowDetails(false);
      setTempScore({ our: '', their: '' });
    } else if (currentGame > 0) {
      setCurrentGame(currentGame - 1);
    } else {
      setStep('count');
    }
  };

  const wins = games.filter(g => g.result === 'win').length;
  const losses = games.filter(g => g.result === 'loss').length;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {step !== 'count' && step !== 'done' && (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={24} color={colors.textMuted} />
              </Pressable>
            )}
            <View style={styles.headerSpacer} />
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Step: Count */}
          {step === 'count' && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.stepContent}
            >
              <Text style={styles.stepTitle}>How many games?</Text>
              <Text style={styles.stepSubtitle}>Quick estimate is fine</Text>

              <View style={styles.countOptions}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Pressable
                    key={num}
                    style={styles.countButton}
                    onPress={() => handleSelectCount(num)}
                  >
                    <Text style={styles.countButtonText}>{num}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={styles.notSureButton}
                onPress={() => handleSelectCount(3)}
              >
                <Text style={styles.notSureButtonText}>Not sure (estimate 3)</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Step: Results */}
          {step === 'results' && !showDetails && (
            <Animated.View
              entering={SlideInRight.duration(250)}
              exiting={SlideOutLeft.duration(200)}
              style={styles.stepContent}
            >
              <View style={styles.progressDots}>
                {Array(gameCount).fill(0).map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.progressDot,
                      idx < currentGame && styles.progressDotComplete,
                      idx === currentGame && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.stepTitle}>Game {currentGame + 1}</Text>
              <Text style={styles.stepSubtitle}>Who won?</Text>

              <View style={styles.resultButtons}>
                <Pressable
                  style={[styles.resultButton, styles.winButton]}
                  onPress={() => handleGameResult('win')}
                >
                  <Text style={styles.resultButtonText}>{teamALabel} won</Text>
                </Pressable>

                <Pressable
                  style={[styles.resultButton, styles.lossButton]}
                  onPress={() => handleGameResult('loss')}
                >
                  <Text style={styles.resultButtonTextLight}>{teamBLabel} won</Text>
                </Pressable>
              </View>

              <Pressable style={styles.addDetailsButton} onPress={handleAddDetails}>
                <Text style={styles.addDetailsText}>Add score details (optional)</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Step: Details (optional) */}
          {step === 'results' && showDetails && (
            <Animated.View
              entering={FadeInUp.duration(200)}
              style={styles.stepContent}
            >
              <Text style={styles.stepTitle}>Score details</Text>
              <Text style={styles.stepSubtitle}>Game {currentGame + 1}</Text>

              <View style={styles.scoreInputRow}>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreInputLabel}>{teamALabel}</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={tempScore.our}
                    onChangeText={(t) => setTempScore({ ...tempScore, our: t })}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                </View>
                <Text style={styles.scoreDash}>-</Text>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreInputLabel}>{teamBLabel}</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={tempScore.their}
                    onChangeText={(t) => setTempScore({ ...tempScore, their: t })}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                </View>
              </View>

              <View style={styles.detailsActions}>
                <Pressable style={styles.skipDetailsButton} onPress={() => setShowDetails(false)}>
                  <Text style={styles.skipDetailsText}>Skip</Text>
                </Pressable>
                <Pressable style={styles.saveDetailsButton} onPress={handleSaveDetails}>
                  <Text style={styles.saveDetailsText}>Save</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.stepContent}
            >
              <View style={styles.doneIcon}>
                <Check size={32} color={colors.accent} />
              </View>

              <Text style={styles.stepTitle}>All done!</Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{teamALabel}</Text>
                  <Text style={[styles.summaryValue, wins > losses && styles.summaryWinner]}>
                    {wins}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{teamBLabel}</Text>
                  <Text style={[styles.summaryValue, losses > wins && styles.summaryWinner]}>
                    {losses}
                  </Text>
                </View>
              </View>

              <Pressable style={styles.completeButton} onPress={handleComplete}>
                <Text style={styles.completeButtonText}>Save session</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  stepTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xxl * 2,
  },
  countOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  countButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  countButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  notSureButton: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  notSureButtonText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.whiteMedium,
  },
  progressDotComplete: {
    backgroundColor: colors.accent,
  },
  progressDotActive: {
    backgroundColor: colors.white,
    width: 24,
  },
  resultButtons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  resultButton: {
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  winButton: {
    backgroundColor: colors.accent,
  },
  lossButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  resultButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '600',
  },
  resultButtonTextLight: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  addDetailsButton: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  addDetailsText: {
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  scoreInputGroup: {
    alignItems: 'center',
  },
  scoreInputLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  scoreInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.lg,
    width: 80,
    height: 64,
    textAlign: 'center',
    color: colors.white,
    fontSize: 28,
    fontWeight: '600',
  },
  scoreDash: {
    color: colors.textMuted,
    fontSize: 24,
    marginTop: spacing.xl,
  },
  detailsActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skipDetailsButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  skipDetailsText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  saveDetailsButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  saveDetailsText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  doneIcon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  summaryValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '600',
  },
  summaryWinner: {
    color: colors.accent,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  completeButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
});
