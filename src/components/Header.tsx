import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Alert, Pressable } from 'react-native';
import { Settings, X } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

interface HeaderProps {
  userAvatar: string;
  userElo: string;
  location: string;
  // Team mode props
  partnerAvatar?: string;
  teamElo?: string;
  onLeaveTeam?: () => void;
  // Match mode props
  isMatchInProgress?: boolean;
  onCancelMatch?: () => void;
  // Dev mode
  onLongPressLocation?: () => void;
  // Profile sidebar
  onProfilePress?: () => void;
}

export function Header({ userAvatar, userElo, partnerAvatar, teamElo, onLeaveTeam, isMatchInProgress, onCancelMatch, onLongPressLocation, onProfilePress }: HeaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isTeamMode = !!partnerAvatar;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleXPress = () => {
    if (isMatchInProgress && onCancelMatch) {
      Alert.alert(
        'Cancel match?',
        'This will end the current match for all players.',
        [
          { text: 'Keep Playing', style: 'cancel' },
          { text: 'Cancel Match', style: 'destructive', onPress: onCancelMatch },
        ]
      );
    } else if (onLeaveTeam) {
      Alert.alert(
        'Leave team?',
        'You will be removed from your current team.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: onLeaveTeam },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* User/Team Avatar with ELO */}
      <Pressable
        style={styles.userSection}
        onPress={onProfilePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isTeamMode ? (
          <View style={styles.teamAvatars}>
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
            <Image source={{ uri: partnerAvatar }} style={[styles.avatar, styles.partnerAvatar]} />
          </View>
        ) : (
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
        )}
        <Text style={styles.eloText}>{isTeamMode ? teamElo : userElo}</Text>
      </Pressable>

      {/* Location - Centered */}
      <Pressable
        style={styles.locationSection}
        onLongPress={onLongPressLocation}
        delayLongPress={2000}
      >
        <Text style={styles.titleText}>Lincoln Park Courts</Text>
        <View style={styles.subtitleRow}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.subtitleText}>Live now · updated 1 min ago</Text>
        </View>
      </Pressable>

      {/* Settings or Leave/Cancel Button */}
      {isTeamMode || isMatchInProgress ? (
        <TouchableOpacity style={styles.leaveButton} activeOpacity={0.7} onPress={handleXPress}>
          <X size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
          <Settings size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
  },
  eloText: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
  },
  locationSection: {
    alignItems: 'center',
  },
  titleText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  subtitleText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 12,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  teamAvatars: {
    flexDirection: 'row',
  },
  partnerAvatar: {
    marginLeft: -12,
    borderWidth: 2,
    borderColor: colors.background,
  },
  leaveButton: {
    padding: spacing.sm,
  },
});
