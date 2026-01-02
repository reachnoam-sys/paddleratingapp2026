import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Alert, Pressable } from 'react-native';
import { Bell, Share2, X } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';

interface HeaderProps {
  userAvatar: string;
  userElo: string;
  locationName: string;
  lastUpdated?: string; // e.g., "1m ago", "just now"
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
  // Actions
  onNotificationPress?: () => void;
  onSharePress?: () => void;
  notificationCount?: number;
}

export function Header({
  userAvatar,
  userElo,
  locationName,
  lastUpdated = '1m ago',
  partnerAvatar,
  teamElo,
  onLeaveTeam,
  isMatchInProgress,
  onCancelMatch,
  onLongPressLocation,
  onProfilePress,
  onNotificationPress,
  onSharePress,
  notificationCount = 0,
}: HeaderProps) {
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
        <Text style={styles.titleText}>{locationName || 'Lincoln Park Courts'}</Text>
        <View style={styles.statusRow}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.statusText}>Live now · updated {lastUpdated}</Text>
        </View>
      </Pressable>

      {/* Right Actions */}
      <View style={styles.actionsSection}>
        {isTeamMode || isMatchInProgress ? (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={handleXPress}>
            <X size={22} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={onNotificationPress}
            >
              <Bell size={22} color={colors.textSecondary} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <View style={styles.notificationDot} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={onSharePress}
            >
              <Share2 size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  eloText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 17,
  },
  locationSection: {
    flex: 2,
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.6)',
    borderRadius: borderRadius.full,
  },
  titleText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  notificationDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.red,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
  },
  teamAvatars: {
    flexDirection: 'row',
  },
  partnerAvatar: {
    marginLeft: -12,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
