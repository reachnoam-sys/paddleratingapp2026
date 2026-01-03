import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Users, User } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

const DISMISS_THRESHOLD = 100;

export type MatchType = 'doubles' | 'singles';

interface MatchTypeSheetProps {
  visible: boolean;
  player: Player | null;
  lastSelection?: MatchType;
  onSelectDoubles: (player: Player) => void;
  onSelectSingles: (player: Player) => void;
  onClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MatchTypeSheet({
  visible,
  player,
  lastSelection = 'doubles',
  onSelectDoubles,
  onSelectSingles,
  onClose,
}: MatchTypeSheetProps) {
  const translateY = useSharedValue(400);
  const overlayOpacity = useSharedValue(0);

  // Spring configuration - smooth, no bounce
  const springConfig = {
    damping: 50,
    stiffness: 400,
    mass: 1,
  };

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withSpring(0, springConfig);
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(400, springConfig);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleSelectDoubles = () => {
    if (!player) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectDoubles(player);
  };

  const handleSelectSingles = () => {
    if (!player) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSingles(player);
  };

  // Swipe-to-dismiss gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY * 0.6;
        overlayOpacity.value = interpolate(
          event.translationY,
          [0, DISMISS_THRESHOLD * 2],
          [1, 0.3],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
        translateY.value = withSpring(400, springConfig);
        overlayOpacity.value = withTiming(0, { duration: 150 });
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, springConfig);
        overlayOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // Button scale animations
  const doublesScale = useSharedValue(1);
  const singlesScale = useSharedValue(1);

  const doublesButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doublesScale.value }],
  }));

  const singlesButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: singlesScale.value }],
  }));

  if (!visible || !player) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header with player info */}
            <View style={styles.header}>
              <Text style={styles.title}>Choose match type</Text>
              <View style={styles.playerInfo}>
                <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
            </View>

            {/* Match type options */}
            <View style={styles.options}>
              {/* Doubles - Primary/Recommended */}
              <AnimatedPressable
                style={[
                  styles.optionCard,
                  styles.optionCardPrimary,
                  lastSelection === 'doubles' && styles.optionCardSelected,
                  doublesButtonStyle,
                ]}
                onPress={handleSelectDoubles}
                onPressIn={() => {
                  doublesScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  doublesScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
              >
                <View style={styles.optionIconContainer}>
                  <Users size={24} color={colors.accent} />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>Doubles</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  </View>
                  <Text style={styles.optionSubtitle}>
                    Team up with them and find opponents
                  </Text>
                </View>
              </AnimatedPressable>

              {/* Singles - Secondary */}
              <AnimatedPressable
                style={[
                  styles.optionCard,
                  styles.optionCardSecondary,
                  lastSelection === 'singles' && styles.optionCardSelected,
                  singlesButtonStyle,
                ]}
                onPress={handleSelectSingles}
                onPressIn={() => {
                  singlesScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  singlesScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
              >
                <View style={styles.optionIconContainerSecondary}>
                  <User size={24} color={colors.textSecondary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitleSecondary}>Singles</Text>
                  <Text style={styles.optionSubtitleSecondary}>
                    Challenge 1v1
                  </Text>
                </View>
              </AnimatedPressable>
            </View>

            {/* Cancel button */}
            <Pressable style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  playerName: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  optionCardPrimary: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderColor: 'rgba(57, 255, 20, 0.25)',
  },
  optionCardSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionCardSelected: {
    borderWidth: 2,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconContainerSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  optionTitle: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  optionTitleSecondary: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  optionSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  optionSubtitleSecondary: {
    color: colors.textMuted,
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
});
