import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Switch } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { PlayPreference } from '../types';

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
  systemStatus: SystemStatus;
  onToggleAvailable: (available: boolean) => void;
  onToggleAutoMatch: (enabled: boolean) => void;
  onChangePlayPreference: (pref: PlayPreference) => void;
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
  systemStatus,
  onToggleAvailable,
  onToggleAutoMatch,
  onChangePlayPreference,
  onClose,
}: StatusSelectorModalProps) {
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
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.overlayBackground}
        />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(200)}
        exiting={SlideOutDown.duration(200)}
        style={styles.container}
      >
        <View style={styles.handle} />

        <Text style={styles.title}>Your availability</Text>
        <Text style={styles.subtitle}>We'll handle the rest</Text>

        {/* Current system status display */}
        <View style={styles.systemStatusCard}>
          <View style={styles.systemStatusHeader}>
            <View style={[styles.statusDot, { backgroundColor: systemStatus.color }]} />
            <Text style={[styles.systemStatusLabel, { color: systemStatus.color }]}>
              {systemStatus.label}
            </Text>
          </View>
          <Text style={styles.systemStatusDescription}>{systemStatus.description}</Text>
        </View>

        {/* Available toggle - the ONE user control */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Available to play</Text>
            <Text style={styles.settingDescription}>
              Turn on to join the queue
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailable}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(57, 255, 20, 0.4)' }}
            thumbColor={isAvailable ? 'rgba(57, 255, 20, 0.9)' : 'rgba(255, 255, 255, 0.5)'}
          />
        </View>

        {/* Auto-match preference - only shown when available */}
        {isAvailable && (
          <>
            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-match me</Text>
                <Text style={styles.settingDescription}>
                  Pair me when a game opens
                </Text>
              </View>
              <Switch
                value={autoMatchEnabled}
                onValueChange={handleToggleAutoMatch}
                trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(57, 255, 20, 0.4)' }}
                thumbColor={autoMatchEnabled ? 'rgba(57, 255, 20, 0.9)' : 'rgba(255, 255, 255, 0.5)'}
              />
            </View>

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
              <Text style={styles.preferenceHint}>
                {playPreference === 'Either'
                  ? "You'll be matched for any available game"
                  : `Prioritizes ${playPreference.toLowerCase()} when matching`}
              </Text>
            </View>
          </>
        )}

        <Pressable style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </Animated.View>
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
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  systemStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  systemStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  systemStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  systemStatusDescription: {
    color: colors.textMuted,
    fontSize: 13,
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
    marginBottom: 2,
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing.sm,
  },
  preferenceSection: {
    marginTop: spacing.lg,
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
  preferenceHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
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
