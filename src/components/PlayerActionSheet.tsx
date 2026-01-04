import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Users, Swords, ChevronRight } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { eloToRating } from '../utils';
import type { Player } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PlayerActionSheetProps {
  visible: boolean;
  player: Player | null;
  onClose: () => void;
  onPartnerUp: (player: Player) => void;
  onPlaySingles: (player: Player) => void;
}

const springConfig = {
  damping: 28,
  stiffness: 350,
  mass: 0.8,
};

export function PlayerActionSheet({
  visible,
  player,
  onClose,
  onPartnerUp,
  onPlaySingles,
}: PlayerActionSheetProps) {
  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);
  const optionScale1 = useSharedValue(0.95);
  const optionScale2 = useSharedValue(0.95);

  useEffect(() => {
    if (visible && player) {
      translateY.value = withSpring(0, springConfig);
      opacity.value = withTiming(1, { duration: 250 });
      optionScale1.value = withDelay(100, withSpring(1, springConfig));
      optionScale2.value = withDelay(150, withSpring(1, springConfig));
    } else {
      translateY.value = withTiming(400, { duration: 200, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 200 });
      optionScale1.value = 0.95;
      optionScale2.value = 0.95;
    }
  }, [visible, player]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const option1Style = useAnimatedStyle(() => ({
    transform: [{ scale: optionScale1.value }],
    opacity: optionScale1.value,
  }));

  const option2Style = useAnimatedStyle(() => ({
    transform: [{ scale: optionScale2.value }],
    opacity: optionScale2.value,
  }));

  const handlePartnerUp = () => {
    if (!player) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPartnerUp(player);
  };

  const handlePlaySingles = () => {
    if (!player) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlaySingles(player);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Swipe down to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(400, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
        opacity.value = withTiming(0, { duration: 200 });
      } else {
        translateY.value = withSpring(0, springConfig);
      }
    });

  if (!visible || !player) return null;

  const rating = eloToRating(player.elo);
  const firstName = player.name.split(' ')[0];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Player header */}
          <View style={styles.playerHeader}>
            <Image source={{ uri: player.avatar }} style={styles.avatar} />
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerRating}>{rating} Rating</Text>
          </View>

          {/* Action options */}
          <View style={styles.optionsContainer}>
            {/* Partner Up option */}
            <Animated.View style={option1Style}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionCard,
                  styles.optionCardPartner,
                  pressed && styles.optionCardPressed,
                ]}
                onPress={handlePartnerUp}
              >
                <View style={styles.optionIconContainer}>
                  <Users size={24} color={colors.accent} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Partner Up</Text>
                  <Text style={styles.optionDescription}>
                    Team up with {firstName} and find opponents
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
            </Animated.View>

            {/* Play Singles option */}
            <Animated.View style={option2Style}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionCard,
                  pressed && styles.optionCardPressed,
                ]}
                onPress={handlePlaySingles}
              >
                <View style={[styles.optionIconContainer, styles.optionIconSingles]}>
                  <Swords size={24} color="#F59E0B" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Play Singles</Text>
                  <Text style={styles.optionDescription}>
                    Challenge {firstName} to a 1v1 match
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
            </Animated.View>
          </View>

          {/* Cancel button */}
          <Pressable style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  playerHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.borderLight,
  },
  playerName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  playerRating: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionCardPartner: {
    borderColor: `${colors.accent}30`,
    backgroundColor: `${colors.accent}08`,
  },
  optionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionIconSingles: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
});
