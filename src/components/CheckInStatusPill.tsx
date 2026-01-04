import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronDown } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

// User presence states
export type PresenceStatus = 'not_checked_in' | 'available' | 'waiting' | 'on_court';

interface CheckInStatusPillProps {
  status: PresenceStatus;
  onCheckIn: () => void;
  onStatusPress: () => void;
  autoMatchEnabled?: boolean;
}

const STATUS_CONFIG: Record<PresenceStatus, { label: string; color: string }> = {
  not_checked_in: {
    label: 'Check In',
    color: colors.accent,
  },
  available: {
    label: 'Available',
    color: '#39FF14',
  },
  waiting: {
    label: 'Waiting',
    color: '#FFC107',
  },
  on_court: {
    label: 'On Court',
    color: colors.textSecondary,
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CheckInStatusPill({
  status,
  onCheckIn,
  onStatusPress,
  autoMatchEnabled = true,
}: CheckInStatusPillProps) {
  const isCheckedIn = status !== 'not_checked_in';
  const config = STATUS_CONFIG[status];
  const buttonScale = useSharedValue(1);

  const handlePress = () => {
    if (isCheckedIn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStatusPress();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCheckIn();
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <AnimatedPressable
        style={[styles.button, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {!isCheckedIn ? (
          <Animated.Text
            key="checkin"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.buttonText}
          >
            Check In
          </Animated.Text>
        ) : (
          <Animated.View
            key="status"
            entering={FadeIn.duration(200).delay(100)}
            exiting={FadeOut.duration(150)}
            style={styles.statusContent}
          >
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={styles.statusLabel}>{config.label}</Text>
            <ChevronDown size={16} color={colors.black} style={{ opacity: 0.6 }} />
          </Animated.View>
        )}
      </AnimatedPressable>

      {/* Auto-match text - only show when checked in */}
      {isCheckedIn && (
        <Animated.Text
          entering={FadeIn.duration(200).delay(150)}
          style={styles.autoMatchText}
        >
          Auto-match {autoMatchEnabled ? 'on' : 'off'}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  button: {
    width: '100%',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  autoMatchText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
