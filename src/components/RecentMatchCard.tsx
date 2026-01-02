import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { MoreVertical } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { Player } from '../types';

interface RecentMatchCardProps {
  user: Player;
  partner: Player;
  opponents: Player[];
  onPlayAgain: () => void;
  onLogScore: () => void;
  onDismiss?: () => void;
}

export function RecentMatchCard({
  user,
  partner,
  opponents,
  onPlayAgain,
  onLogScore,
  onDismiss,
}: RecentMatchCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const userName = user.name.split(' ')[0];
  const partnerName = partner.name.split(' ')[0];
  const opp1Name = opponents[0]?.name.split(' ')[0] ?? '';
  const opp2Name = opponents[1]?.name.split(' ')[0] ?? '';

  const handleMenuOption = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.statusDot} />
            <Text style={styles.title}>Recent match</Text>
          </View>
          <Pressable
            style={styles.menuButton}
            onPress={() => setMenuOpen(!menuOpen)}
            hitSlop={8}
          >
            <MoreVertical size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {menuOpen && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={styles.menuDropdown}
          >
            <Pressable
              style={styles.menuItem}
              onPress={() => handleMenuOption(onLogScore)}
            >
              <Text style={styles.menuItemText}>Log score</Text>
            </Pressable>
            {onDismiss && (
              <>
                <View style={styles.menuDivider} />
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuOption(onDismiss)}
                >
                  <Text style={styles.menuItemText}>Dismiss</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        )}

        <View style={styles.teamsRow}>
          <View style={styles.teamAvatars}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Image source={{ uri: partner.avatar }} style={[styles.avatar, styles.avatarOverlap]} />
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.teamAvatars}>
            {opponents.slice(0, 2).map((player, idx) => (
              <Image
                key={player.id}
                source={{ uri: player.avatar }}
                style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.matchup}>
          {userName} + {partnerName} vs {opp1Name} + {opp2Name}
        </Text>
        <Text style={styles.subtext}>Played recently</Text>
      </Animated.View>

      {/* Primary CTA */}
      <Pressable style={styles.playAgainButton} onPress={onPlayAgain}>
        <Text style={styles.playAgainText}>Play again</Text>
      </Pressable>

      {/* Secondary text button */}
      <Pressable style={styles.logScoreButton} onPress={onLogScore}>
        <Text style={styles.logScoreText}>Log score</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  menuDropdown: {
    position: 'absolute',
    top: spacing.xl + 24,
    right: spacing.xl,
    backgroundColor: colors.cardElevated ?? colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    zIndex: 10,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textMuted,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  teamAvatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  matchup: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtext: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  playAgainText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  logScoreButton: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  logScoreText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
