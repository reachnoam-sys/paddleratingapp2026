import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
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
import { User } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

const DISMISS_THRESHOLD = 100;

interface SwitchToSinglesSheetProps {
  visible: boolean;
  partner: Player | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SwitchToSinglesSheet({
  visible,
  partner,
  onConfirm,
  onCancel,
}: SwitchToSinglesSheetProps) {
  const translateY = useSharedValue(400);
  const overlayOpacity = useSharedValue(0);
  const confirmButtonScale = useSharedValue(1);

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

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

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
        runOnJS(handleCancel)();
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

  const animatedConfirmStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmButtonScale.value }],
  }));

  if (!visible || !partner) return null;

  const partnerFirstName = partner.name.split(' ')[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <User size={28} color={colors.accent} />
            </View>

            {/* Content */}
            <Text style={styles.title}>Start Singles match?</Text>
            <Text style={styles.body}>
              This switches you and {partnerFirstName} to Singles for this session. You'll play 1v1 against each other.
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <AnimatedPressable
                style={[styles.confirmButton, animatedConfirmStyle]}
                onPress={handleConfirm}
                onPressIn={() => {
                  confirmButtonScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  confirmButtonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
              >
                <Text style={styles.confirmButtonText}>Start Singles</Text>
              </AnimatedPressable>

              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
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
    alignItems: 'center',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
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
