import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  ActionSheetIOS,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  X,
  Camera,
  User,
  Users,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  ChevronRight,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  Pencil,
  Check,
  Star,
  Flame,
  Award,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { eloToRating } from '../utils/rating';
import type { CurrentUser } from '../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const springConfig = {
  damping: 24,
  stiffness: 280,
  mass: 0.85,
};

// Ultra-premium snap back spring
const snapBackSpring = {
  damping: 32,
  stiffness: 400,
  mass: 0.7,
};

interface ProfileScreenProps {
  onClose?: () => void;
  onSwipeToActivity?: () => void;
  user: CurrentUser | null;
  singlesRating?: number;
  doublesRating?: number;
  onUpdateName?: (name: string) => void;
  onUpdateAvatar?: (uri: string) => void;
  onMatchHistory?: () => void;
}

// Premium stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  index,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  index: number;
}) {
  return (
    <Animated.View
      style={styles.statCard}
      entering={FadeInDown.delay(200 + index * 80).duration(400).springify()}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </Animated.View>
  );
}

// Rating card with animated progress ring
function RatingCard({
  type,
  rating,
  gamesPlayed,
  winRate,
  index,
}: {
  type: 'singles' | 'doubles';
  rating: number;
  gamesPlayed: number;
  winRate: number;
  index: number;
}) {
  const displayRating = rating ? eloToRating(rating) : '—';
  const Icon = type === 'singles' ? User : Users;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(400 + index * 100, withSpring(winRate / 100, { damping: 20, stiffness: 100 }));
  }, [winRate]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Animated.View
      style={styles.ratingCard}
      entering={FadeInDown.delay(300 + index * 100).duration(400).springify()}
    >
      <View style={styles.ratingCardHeader}>
        <View style={styles.ratingTypeRow}>
          <View style={styles.ratingIconBg}>
            <Icon size={16} color={colors.accent} />
          </View>
          <Text style={styles.ratingTypeLabel}>
            {type === 'singles' ? 'Singles' : 'Doubles'}
          </Text>
        </View>
        <Text style={styles.ratingMainValue}>{displayRating}</Text>
      </View>

      <View style={styles.ratingStatsRow}>
        <View style={styles.ratingStat}>
          <Text style={styles.ratingStatValue}>{gamesPlayed}</Text>
          <Text style={styles.ratingStatLabel}>Games</Text>
        </View>
        <View style={styles.ratingStatDivider} />
        <View style={styles.ratingStat}>
          <Text style={styles.ratingStatValue}>{winRate}%</Text>
          <Text style={styles.ratingStatLabel}>Win Rate</Text>
        </View>
      </View>

      {/* Win rate progress bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, progressStyle]} />
      </View>
    </Animated.View>
  );
}

// Achievement badge component
function AchievementBadge({
  icon: Icon,
  title,
  description,
  unlocked,
  index,
}: {
  icon: typeof Trophy;
  title: string;
  description: string;
  unlocked: boolean;
  index: number;
}) {
  return (
    <Animated.View
      style={[styles.achievementBadge, !unlocked && styles.achievementLocked]}
      entering={FadeInDown.delay(500 + index * 60).duration(300)}
    >
      <View style={[styles.achievementIcon, unlocked && styles.achievementIconUnlocked]}>
        <Icon size={20} color={unlocked ? colors.accent : colors.textMuted} />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, !unlocked && styles.achievementTitleLocked]}>
          {title}
        </Text>
        <Text style={styles.achievementDescription}>{description}</Text>
      </View>
      {unlocked && (
        <View style={styles.achievementCheckmark}>
          <Check size={14} color={colors.accent} strokeWidth={3} />
        </View>
      )}
    </Animated.View>
  );
}

// Menu item component
function MenuItem({
  icon: Icon,
  label,
  onPress,
  showChevron = true,
  danger = false,
  index,
}: {
  icon: typeof Settings;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
  index: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(600 + index * 50).duration(300)}>
      <AnimatedPressable
        style={[styles.menuItem, animatedStyle]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
      >
        <View style={[styles.menuItemIcon, danger && styles.menuItemIconDanger]}>
          <Icon size={18} color={danger ? colors.red : colors.textSecondary} />
        </View>
        <Text style={[styles.menuItemLabel, danger && styles.menuItemLabelDanger]}>
          {label}
        </Text>
        {showChevron && (
          <ChevronRight size={18} color={colors.textMuted} />
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export function ProfileScreen({
  onClose,
  onSwipeToActivity,
  user,
  singlesRating = 1200,
  doublesRating = 1200,
  onUpdateName,
  onUpdateAvatar,
  onMatchHistory,
}: ProfileScreenProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Animation values
  const screenOpacity = useSharedValue(0);
  const screenTranslateX = useSharedValue(0);
  const headerScale = useSharedValue(0.9);

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    headerScale.value = withSpring(1, springConfig);
  }, []);

  // Ultra-smooth swipe gesture for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onStart(() => {
      'worklet';
      cancelAnimation(screenTranslateX);
      cancelAnimation(screenOpacity);
    })
    .onUpdate((event) => {
      'worklet';
      // Swipe right to go to Activity (Profile is rightmost, so swipe right goes to Activity)
      if (event.translationX > 0 && onSwipeToActivity) {
        const progress = Math.min(event.translationX / SCREEN_WIDTH, 1);
        const easedProgress = progress * (2 - progress);
        screenTranslateX.value = easedProgress * SCREEN_WIDTH * 0.8;
        screenOpacity.value = interpolate(
          progress,
          [0, 0.5, 1],
          [1, 0.85, 0.4],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      'worklet';
      const velocity = event.velocityX;
      const translation = event.translationX;
      const velocityThreshold = 400;
      const distanceThreshold = SCREEN_WIDTH * 0.2;

      // Swipe right threshold - go to Activity
      if (translation > distanceThreshold || velocity > velocityThreshold) {
        if (onSwipeToActivity) {
          const baseDuration = 280;
          const velocityBonus = Math.min(Math.abs(velocity) / 2000, 0.5);
          const duration = baseDuration * (1 - velocityBonus);

          screenTranslateX.value = withTiming(SCREEN_WIDTH, {
            duration,
            easing: Easing.out(Easing.cubic),
          });
          screenOpacity.value = withTiming(0, { duration: duration * 0.7 }, () => {
            runOnJS(onSwipeToActivity)();
          });
          return;
        }
      }
      // Snap back with premium spring physics
      screenTranslateX.value = withSpring(0, snapBackSpring);
      screenOpacity.value = withSpring(1, snapBackSpring);
    });

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateX: screenTranslateX.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    screenOpacity.value = withTiming(0, { duration: 200 }, () => {
      if (onClose) runOnJS(onClose)();
    });
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
      Alert.alert('Change Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: pickImageFromCamera },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
      ]);
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required.');
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

  const handleStartEditName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedName(user?.name || 'Player');
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

  // Mock data for demo
  const memberSince = 'Dec 2024';
  const totalGames = 47;
  const winStreak = 5;
  const longestStreak = 8;

  // Mock achievements
  const achievements = [
    { icon: Flame, title: 'Hot Streak', description: '5 wins in a row', unlocked: true },
    { icon: Target, title: 'Sharpshooter', description: '90%+ win rate', unlocked: false },
    { icon: Award, title: 'Champion', description: 'Win a tournament', unlocked: false },
    { icon: Star, title: 'All-Star', description: 'Reach 4.5 rating', unlocked: true },
  ];

  const displayName = user?.name || 'Player';

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.container, screenStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Card */}
          <Animated.View style={[styles.profileCard, headerStyle]}>
            {/* Avatar */}
            <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User size={40} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.cameraButton}>
                <Camera size={14} color={colors.white} />
              </View>
            </Pressable>

            {/* Name */}
            {isEditingName ? (
              <Animated.View
                style={styles.nameEditContainer}
                entering={FadeIn.duration(200)}
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
                    <X size={18} color={colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={handleSaveName} style={styles.nameEditButton}>
                    <Check size={18} color={colors.accent} />
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <Pressable onPress={handleStartEditName} style={styles.nameRow}>
                <Text style={styles.userName}>{displayName}</Text>
                <Pencil size={16} color={colors.textMuted} />
              </Pressable>
            )}

            {/* Member since */}
            <View style={styles.memberRow}>
              <Calendar size={12} color={colors.textMuted} />
              <Text style={styles.memberText}>Member since {memberSince}</Text>
            </View>
          </Animated.View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon={Trophy}
              label="Total Games"
              value={totalGames.toString()}
              color={colors.accent}
              index={0}
            />
            <StatCard
              icon={Flame}
              label="Win Streak"
              value={winStreak.toString()}
              subValue={`Best: ${longestStreak}`}
              color="#F59E0B"
              index={1}
            />
          </View>

          {/* Rating Cards */}
          <Text style={styles.sectionTitle}>Ratings</Text>
          <RatingCard
            type="singles"
            rating={singlesRating}
            gamesPlayed={28}
            winRate={64}
            index={0}
          />
          <RatingCard
            type="doubles"
            rating={doublesRating}
            gamesPlayed={19}
            winRate={58}
            index={1}
          />

          {/* Achievements Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>
              {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
            </Text>
          </View>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={achievement.title}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
                unlocked={achievement.unlocked}
                index={index}
              />
            ))}
          </View>

          {/* Menu Section */}
          <Text style={[styles.sectionTitle, styles.menuSectionTitle]}>Settings</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={Bell}
              label="Notifications"
              onPress={() => {}}
              index={0}
            />
            <MenuItem
              icon={Settings}
              label="Preferences"
              onPress={() => {}}
              index={1}
            />
            <MenuItem
              icon={HelpCircle}
              label="Help & Support"
              onPress={() => {}}
              index={2}
            />
            <MenuItem
              icon={LogOut}
              label="Sign Out"
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: () => {} },
                ]);
              }}
              danger
              showChevron={false}
              index={3}
            />
          </View>

          {/* Version */}
          <Text style={styles.version}>PaddleRating v1.0.0</Text>

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  avatarPlaceholder: {
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  userName: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nameEditContainer: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  nameInput: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  nameEditActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  nameEditButton: {
    padding: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statSubValue: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  ratingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ratingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ratingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTypeLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  ratingMainValue: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  ratingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingStat: {
    flex: 1,
    alignItems: 'center',
  },
  ratingStatValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  ratingStatLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  ratingStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  achievementsGrid: {
    marginBottom: spacing.xl,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  achievementIconUnlocked: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementTitleLocked: {
    color: colors.textMuted,
  },
  achievementDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  achievementCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSectionTitle: {
    marginTop: spacing.md,
  },
  menuContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuItemIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  menuItemLabel: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemLabelDanger: {
    color: colors.red,
  },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
