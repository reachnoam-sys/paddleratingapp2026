import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  BackHandler,
  TextInput,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  User,
  History,
  ChevronRight,
  Pencil,
  Users,
  Camera,
  Check,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { CurrentUser } from '../types';
import { eloToRating } from '../utils';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.52;

interface ProfileSidebarProps {
  visible: boolean;
  onClose: () => void;
  user: CurrentUser | null;
  singlesRating?: number;
  doublesRating?: number;
  onUpdateName?: (name: string) => void;
  onUpdateAvatar?: (uri: string) => void;
  onMatchHistory?: () => void;
}

export function ProfileSidebar({
  visible,
  onClose,
  user,
  singlesRating,
  doublesRating,
  onUpdateName,
  onUpdateAvatar,
  onMatchHistory,
}: ProfileSidebarProps) {
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        if (isEditingName) {
          setIsEditingName(false);
          return true;
        }
        onClose();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [visible, onClose, isEditingName]);

  useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, {
        damping: 22,
        stiffness: 280,
        mass: 0.6,
      });
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      overlayOpacity.value = withTiming(0, { duration: 150 });
      setIsEditingName(false);
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0 && !isEditingName) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if ((event.translationX < -50 || event.velocityX < -400) && !isEditingName) {
        translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 150 });
        overlayOpacity.value = withTiming(0, { duration: 150 });
        runOnJS(onClose)();
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
      }
    });

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? 'auto' : 'none',
  }));

  const handleStartEditName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedName(user?.name || 'First Last');
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onUpdateName && editedName.trim()) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingName(false);
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await pickImageFromCamera();
          } else if (buttonIndex === 2) {
            await pickImageFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Change Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: pickImageFromCamera },
          { text: 'Choose from Library', onPress: pickImageFromLibrary },
        ]
      );
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdateAvatar?.(result.assets[0].uri);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdateAvatar?.(result.assets[0].uri);
    }
  };

  const handleMatchHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onMatchHistory) {
      onClose();
      setTimeout(onMatchHistory, 250);
    }
  };

  if (!visible && translateX.value <= -SIDEBAR_WIDTH + 1) {
    return null;
  }

  const singlesDisplay = singlesRating ? eloToRating(singlesRating) : '—';
  const doublesDisplay = doublesRating ? eloToRating(doublesRating) : '—';
  const displayName = user?.name || 'First Last';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sidebar, sidebarStyle]}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            {/* Avatar with camera overlay */}
            <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User size={28} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={12} color={colors.white} />
              </View>
            </Pressable>

            {/* Name with edit button */}
            {isEditingName ? (
              <Animated.View
                entering={FadeIn.duration(150)}
                exiting={FadeOut.duration(150)}
                style={styles.nameEditContainer}
              >
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  autoFocus
                  selectTextOnFocus
                  maxLength={30}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <View style={styles.nameEditActions}>
                  <Pressable onPress={handleCancelEdit} style={styles.nameEditButton}>
                    <X size={16} color={colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={handleSaveName} style={styles.nameEditButton}>
                    <Check size={16} color={colors.accent} />
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <Pressable onPress={handleStartEditName} style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                <Pencil size={14} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Ratings - Compact */}
          <View style={styles.ratingsSection}>
            <View style={styles.ratingRow}>
              <View style={styles.ratingIcon}>
                <User size={14} color={colors.accent} />
              </View>
              <View style={styles.ratingInfo}>
                <Text style={styles.ratingLabel}>Singles</Text>
                <Text style={styles.ratingValue}>{singlesDisplay}</Text>
              </View>
            </View>

            <View style={styles.ratingDivider} />

            <View style={styles.ratingRow}>
              <View style={styles.ratingIcon}>
                <Users size={14} color={colors.accent} />
              </View>
              <View style={styles.ratingInfo}>
                <Text style={styles.ratingLabel}>Doubles</Text>
                <Text style={styles.ratingValue}>{doublesDisplay}</Text>
              </View>
            </View>
          </View>

          {/* Match History Button */}
          <Pressable
            style={({ pressed }) => [
              styles.historyButton,
              pressed && styles.historyButtonPressed,
            ]}
            onPress={handleMatchHistory}
          >
            <History size={18} color={colors.white} />
            <Text style={styles.historyButtonText}>Match History</Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </Pressable>

          {/* Version - Bottom */}
          <Text style={styles.version}>v1.0.0</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: 'rgba(18, 18, 18, 0.92)',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarPlaceholder: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  nameEditContainer: {
    width: '100%',
  },
  nameInput: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  nameEditActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  nameEditButton: {
    padding: spacing.sm,
  },
  ratingsSection: {
    paddingVertical: spacing.xl,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  ratingValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  ratingDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  historyButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  historyButtonText: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  version: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
  },
});
