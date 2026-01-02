import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, spacing, borderRadius } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = 280;
const SNAP_THRESHOLD = 50;

interface LogMatchDrawerProps {
  visible: boolean;
  onLogScore: () => void;
  onDidntPlay: () => void;
  onClose: () => void;
}

export function LogMatchDrawer({
  visible,
  onLogScore,
  onDidntPlay,
  onClose,
}: LogMatchDrawerProps) {
  const translateY = useSharedValue(DRAWER_HEIGHT);
  const context = useSharedValue({ y: 0 });

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      translateY.value = withTiming(DRAWER_HEIGHT, { duration: 200 });
    }
  }, [visible]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, context.value.y + event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > SNAP_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(DRAWER_HEIGHT, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.drawer, animatedStyle]}>
          {/* Grab Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Log this match?</Text>
            <Text style={styles.subtitle}>
              Record the score or skip if you didn't play
            </Text>

            <Pressable style={styles.primaryButton} onPress={onLogScore}>
              <Text style={styles.primaryButtonText}>Log score</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onDidntPlay}>
              <Text style={styles.secondaryButtonText}>Didn't play</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

// Grab handle pill component for use outside the drawer
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
      // Reset state at the start of each gesture
      hasTriggeredHaptic.value = false;
    })
    .onUpdate((event) => {
      // Only respond to upward movement
      if (event.translationY < 0) {
        // Smooth resistance - moves less the further you pull
        const resistance = 0.4;
        const maxPull = -60;
        translateY.value = Math.max(maxPull, event.translationY * resistance);

        // Trigger haptic when crossing threshold
        if (translateY.value < -20 && !hasTriggeredHaptic.value) {
          hasTriggeredHaptic.value = true;
          runOnJS(triggerLightHaptic)();
        }
      }
    })
    .onEnd((event) => {
      // Reset haptic flag
      hasTriggeredHaptic.value = false;

      // Trigger if swiped up enough or with enough velocity
      if (event.translationY < -30 || event.velocityY < -200) {
        runOnJS(triggerHaptic)();
        runOnJS(onPress)();
      }
      // Always smoothly reset position
      translateY.value = withTiming(0, { duration: 150 });
    });

  // Only swipe gesture - no tap to avoid accidental triggers
  const composedGesture = swipeGesture;

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
    <GestureDetector gesture={composedGesture}>
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

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
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
  content: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});

const grabHandleStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
