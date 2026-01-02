import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MapPin, Activity, Trophy, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabId = 'courts' | 'activity' | 'leaderboard' | 'profile';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof MapPin;
}

const TABS: Tab[] = [
  { id: 'courts', label: 'Courts', icon: MapPin },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User },
];

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function NavTab({
  tab,
  isActive,
  onPress,
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const Icon = tab.icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      style={[styles.tab, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Icon
        size={20}
        color={isActive ? colors.white : 'rgba(255, 255, 255, 0.35)'}
        strokeWidth={isActive ? 2 : 1.5}
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
        {tab.label}
      </Text>
    </AnimatedPressable>
  );
}

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TABS.map((tab) => (
          <NavTab
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabChange(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 28,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(18, 18, 18, 0.92)',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
});
