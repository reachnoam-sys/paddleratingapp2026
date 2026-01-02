import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { X, TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  userElo: number;
}

export function ChallengeModal({ isOpen, onClose, player, userElo }: ChallengeModalProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const eloDiff = player ? userElo - player.elo : 0;
  const winProbability = Math.round(50 + (eloDiff / 20));
  const clampedProbability = Math.max(10, Math.min(90, winProbability));

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(0, { damping: 30, stiffness: 300 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
      progressWidth.value = withTiming(clampedProbability, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 30, stiffness: 300 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
      progressWidth.value = 0;
    }
  }, [isOpen, clampedProbability]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  if (!player) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X size={24} color={colors.textSubtle} />
        </Pressable>

        <View style={styles.dragIndicator} />

        <View style={styles.opponentSection}>
          <Image source={{ uri: player.avatar }} style={styles.opponentAvatar} />
          <Text style={styles.opponentName}>{player.name}</Text>
          <View style={styles.opponentEloRow}>
            <Text style={styles.eloLabel}>ELO</Text>
            <Text style={styles.opponentElo}>{player.elo}</Text>
          </View>
        </View>

        <View style={styles.predictionSection}>
          <Text style={styles.predictionTitle}>Match Prediction</Text>

          <View style={styles.probabilityRow}>
            {clampedProbability >= 50 ? (
              <TrendingUp size={24} color={colors.accent} />
            ) : (
              <TrendingDown size={24} color={colors.red} />
            )}
            <Text style={styles.probabilityValue}>{clampedProbability}%</Text>
          </View>
          <Text style={styles.probabilityLabel}>Win Probability</Text>

          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
          </View>

          <View style={styles.eloComparison}>
            <View style={styles.eloColumn}>
              <Text style={styles.eloCompareLabel}>Your ELO</Text>
              <Text style={styles.eloCompareValue}>{userElo}</Text>
            </View>
            <View style={styles.eloColumn}>
              <Text style={styles.eloCompareLabel}>Opponent ELO</Text>
              <Text style={styles.eloCompareValue}>{player.elo}</Text>
            </View>
          </View>
        </View>

        <AnimatedPressable
          style={[styles.sendChallengeButton, animatedButtonStyle]}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
        >
          <Text style={styles.sendChallengeText}>SEND CHALLENGE</Text>
        </AnimatedPressable>

        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blackOverlay,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.sm,
    zIndex: 10,
  },
  dragIndicator: {
    width: 48,
    height: 4,
    backgroundColor: colors.whiteBorder,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
  opponentSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  opponentAvatar: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    borderWidth: 4,
    borderColor: colors.whiteMedium,
    marginBottom: spacing.md,
  },
  opponentName: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  opponentEloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eloLabel: {
    color: colors.textSubtle,
    fontSize: 14,
  },
  opponentElo: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 24,
  },
  predictionSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  predictionTitle: {
    color: colors.textSubtle,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  probabilityValue: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 40,
    lineHeight: 40,
  },
  probabilityLabel: {
    color: colors.textSubtle,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.whiteMedium,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  eloComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  eloColumn: {
    alignItems: 'center',
  },
  eloCompareLabel: {
    color: colors.textSubtle,
    fontSize: 14,
    marginBottom: 4,
  },
  eloCompareValue: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  sendChallengeButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  sendChallengeText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 20,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelText: {
    color: colors.textSubtle,
    fontWeight: '700',
    fontSize: 16,
  },
});
