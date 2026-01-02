import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
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

type PlayerStatus = 'Ready' | 'Waiting' | 'On Court';

interface StatusOption {
  value: PlayerStatus;
  label: string;
  description: string;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'Ready',
    label: 'Ready',
    description: 'Available to play now',
    color: 'rgba(57, 255, 20, 0.7)',
  },
  {
    value: 'Waiting',
    label: 'Waiting',
    description: 'Looking for a game',
    color: 'rgba(255, 193, 7, 0.8)',
  },
  {
    value: 'On Court',
    label: 'On Court',
    description: 'Currently playing',
    color: colors.textMuted,
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StatusSelectorModalProps {
  visible: boolean;
  currentStatus: PlayerStatus;
  onSelectStatus: (status: PlayerStatus) => void;
  onClose: () => void;
}

export function StatusSelectorModal({
  visible,
  currentStatus,
  onSelectStatus,
  onClose,
}: StatusSelectorModalProps) {
  const handleSelect = (status: PlayerStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectStatus(status);
    onClose();
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

        <Text style={styles.title}>Set your status</Text>
        <Text style={styles.subtitle}>Let others know if you're ready to play</Text>

        <View style={styles.optionsContainer}>
          {STATUS_OPTIONS.map((option) => {
            const isSelected = currentStatus === option.value;
            return (
              <StatusOptionButton
                key={option.value}
                option={option}
                isSelected={isSelected}
                onPress={() => handleSelect(option.value)}
              />
            );
          })}
        </View>

        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function StatusOptionButton({
  option,
  isSelected,
  onPress,
}: {
  option: StatusOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.optionButton,
        isSelected && styles.optionButtonSelected,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionHeader}>
          <View style={[styles.statusDot, { backgroundColor: option.color }]} />
          <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
            {option.label}
          </Text>
        </View>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
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
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
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
  optionLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.white,
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 16,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'rgba(57, 255, 20, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
