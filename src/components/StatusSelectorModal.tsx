import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Switch, Dimensions } from 'react-native';
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
import { colors, spacing, borderRadius } from '../theme/colors';
import type { PlayPreference } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

// System-derived status display (read-only, shown to user)
export interface SystemStatus {
  label: string;
  description: string;
  color: string;
}

// Derived status labels for display
export function getDerivedStatusDisplay(context: {
  isOnCourt: boolean;
  isMatching: boolean;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}): SystemStatus {
  if (context.isOnCourt) {
    return {
      label: 'On Court',
      description: 'Currently playing',
      color: colors.textMuted,
    };
  }
  if (context.isMatching) {
    return {
      label: 'Matching',
      description: 'Finding your next game...',
      color: 'rgba(147, 112, 219, 0.8)',
    };
  }
  if (context.queuePosition && context.queuePosition > 0) {
    const waitText = context.estimatedWaitMinutes
      ? `~${context.estimatedWaitMinutes} min wait`
      : `Position ${context.queuePosition}`;
    return {
      label: 'In Queue',
      description: waitText,
      color: 'rgba(255, 193, 7, 0.8)',
    };
  }
  return {
    label: 'Available',
    description: 'Ready for games',
    color: 'rgba(57, 255, 20, 0.7)',
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StatusSelectorModalProps {
  visible: boolean;
  isAvailable: boolean;
  autoMatchEnabled: boolean;
  playPreference: PlayPreference;
  onToggleAvailable: (available: boolean) => void;
  onToggleAutoMatch: (enabled: boolean) => void;
  onChangePlayPreference: (pref: PlayPreference) => void;
  // Called when user selects Singles - should immediately switch game mode
  onSwitchToSingles?: () => void;
  // Called when user selects Doubles - should immediately switch game mode
  onSwitchToDoubles?: () => void;
  onClose: () => void;
}

const PLAY_PREFERENCES: { value: PlayPreference; label: string }[] = [
  { value: 'Either', label: 'Either' },
  { value: 'Singles', label: 'Singles' },
  { value: 'Doubles', label: 'Doubles' },
];

export function StatusSelectorModal({
  visible,
  isAvailable,
  autoMatchEnabled,
  playPreference,
  onToggleAvailable,
  onToggleAutoMatch,
  onChangePlayPreference,
  onSwitchToSingles,
  onSwitchToDoubles,
  onClose,
}: StatusSelectorModalProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  // Spring configuration - no bounce, smooth and restrained
  const springConfig = {
    damping: 50,
    stiffness: 400,
    mass: 1,
  };

  useEffect(() => {
    if (visible) {
      // Animate in - smooth slide, no bounce
      overlayOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withSpring(0, springConfig);
    } else {
      // Animate out
      overlayOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(SCREEN_HEIGHT, springConfig);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleToggleAvailable = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleAvailable(value);
  };

  const handleToggleAutoMatch = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleAutoMatch(value);
  };

  const handlePreferenceChange = (pref: PlayPreference) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangePlayPreference(pref);

    // Immediately switch game mode when Singles or Doubles is selected
    if (pref === 'Singles' && onSwitchToSingles) {
      onSwitchToSingles();
    } else if (pref === 'Doubles' && onSwitchToDoubles) {
      onSwitchToDoubles();
    }
  };

  // Swipe-to-dismiss gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow downward swipe
      if (event.translationY > 0) {
        // Apply resistance for smooth feel
        translateY.value = event.translationY * 0.6;

        // Fade overlay as user drags
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
        // Dismiss - smooth, no bounce
        translateY.value = withSpring(SCREEN_HEIGHT, springConfig);
        overlayOpacity.value = withTiming(0, { duration: 150 });
        runOnJS(handleClose)();
      } else {
        // Snap back - smooth
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

  if (!visible) return null;

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

            <Text style={styles.title}>Settings</Text>

            {/* Available toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Available to play</Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailable}
                trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(57, 255, 20, 0.4)' }}
                thumbColor={isAvailable ? 'rgba(57, 255, 20, 0.9)' : 'rgba(255, 255, 255, 0.5)'}
              />
            </View>

            <View style={styles.divider} />

            {/* Auto-match toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-match me</Text>
              </View>
              <Switch
                value={autoMatchEnabled}
                onValueChange={handleToggleAutoMatch}
                trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(57, 255, 20, 0.4)' }}
                thumbColor={autoMatchEnabled ? 'rgba(57, 255, 20, 0.9)' : 'rgba(255, 255, 255, 0.5)'}
                disabled={!isAvailable}
              />
            </View>

            <View style={styles.divider} />

            {/* Play preference selector */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceLabel}>Preferred play</Text>
              <View style={styles.preferenceOptions}>
                {PLAY_PREFERENCES.map((pref) => (
                  <PreferenceChip
                    key={pref.value}
                    label={pref.label}
                    isSelected={playPreference === pref.value}
                    onPress={() => handlePreferenceChange(pref.value)}
                  />
                ))}
              </View>
            </View>

            <Pressable style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

function PreferenceChip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.preferenceChip,
        isSelected && styles.preferenceChipSelected,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[styles.preferenceChipText, isSelected && styles.preferenceChipTextSelected]}>
        {label}
      </Text>
    </AnimatedPressable>
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
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  preferenceSection: {
    marginTop: spacing.md,
  },
  preferenceLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  preferenceOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preferenceChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  preferenceChipSelected: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  preferenceChipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  preferenceChipTextSelected: {
    color: 'rgba(57, 255, 20, 0.9)',
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  doneButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
});
