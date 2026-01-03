import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import { Link, Copy, Share2, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 440;
const DISMISS_THRESHOLD = 100;

interface InviteBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  courtId: string;
  courtName: string;
  userId: string;
}

export function InviteBottomSheet({
  visible,
  onClose,
  courtId,
  courtName,
  userId,
}: InviteBottomSheetProps) {
  const [copied, setCopied] = React.useState(false);

  // Animation values
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  // Generate the invite link
  const inviteLink = `https://paddlerating.app/court/${courtId}?ref=${userId}`;

  // Animate sheet in/out when visibility changes
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Reset copied state when sheet closes
  useEffect(() => {
    if (!visible) {
      setCopied(false);
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: `Join me at ${courtName} on PaddleRating!\n\n${inviteLink}`,
        url: inviteLink, // iOS only
        title: `Join ${courtName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Gesture handler for dragging the sheet
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      'worklet';
      // Only allow dragging down (positive Y)
      const newY = context.value.y + event.translationY;
      translateY.value = Math.max(0, newY);

      // Update backdrop opacity based on sheet position
      const progress = Math.max(0, Math.min(1, newY / SHEET_HEIGHT));
      backdropOpacity.value = 1 - progress;
    })
    .onEnd((event) => {
      'worklet';
      // Dismiss if dragged past threshold or with enough velocity
      if (translateY.value > DISMISS_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        // Snap back to open position
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 300,
          mass: 0.8,
        });
        backdropOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  // Animated styles
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, animatedSheetStyle]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Invite to Court</Text>
            <Text style={styles.subtitle}>{courtName}</Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={inviteLink}
                size={160}
                color={colors.white}
                backgroundColor="transparent"
              />
            </View>
            <Text style={styles.qrHint}>Scan to join</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, copied && styles.actionButtonSuccess]}
              onPress={handleCopyLink}
            >
              {copied ? (
                <Check size={20} color={colors.accent} />
              ) : (
                <Copy size={20} color={colors.white} />
              )}
              <Text style={[styles.actionButtonText, copied && styles.actionButtonTextSuccess]}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>Share</Text>
            </Pressable>
          </View>

          {/* Link Preview */}
          <View style={styles.linkPreview}>
            <Link size={14} color={colors.textMuted} />
            <Text style={styles.linkText} numberOfLines={1}>
              {inviteLink}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  qrWrapper: {
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qrHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonSuccess: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  actionButtonTextSuccess: {
    color: colors.accent,
  },
  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
  },
  linkText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
  },
});
