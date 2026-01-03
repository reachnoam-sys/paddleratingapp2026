import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

  // Not checked in - show full-width CTA button
  if (!isCheckedIn) {
    return (
      <AnimatedPressable
        style={[styles.checkInButton, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.checkInButtonText}>Check In</Text>
      </AnimatedPressable>
    );
  }

  // Checked in - show hero status pill with dropdown
  return (
    <View style={styles.wrapper}>
      <AnimatedPressable
        style={[styles.heroPill, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        <Text style={[styles.heroLabel, { color: config.color }]}>
          {config.label}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </AnimatedPressable>

      {/* Auto-match status - secondary muted text */}
      <Text style={styles.autoMatchText}>
        Auto-match {autoMatchEnabled ? 'on' : 'off'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkInButton: {
    width: '100%',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  autoMatchText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
