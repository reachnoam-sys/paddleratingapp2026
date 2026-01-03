import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Clock, Check, AlertCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useMatchStore, Match, MatchStatus } from '../store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabId = 'activity' | 'matches';

interface ActivityScreenProps {
  onClose?: () => void;
  scrollToMatchId?: string | null;
  onClearScrollTarget?: () => void;
}

// Segmented control component
function SegmentedControl({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const indicatorPosition = useSharedValue(activeTab === 'activity' ? 0 : 1);

  useEffect(() => {
    indicatorPosition.value = withSpring(activeTab === 'activity' ? 0 : 1, {
      damping: 20,
      stiffness: 300,
    });
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * 140 }],
  }));

  return (
    <View style={segmentStyles.container}>
      <Animated.View style={[segmentStyles.indicator, indicatorStyle]} />
      <Pressable
        style={segmentStyles.tab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('activity');
        }}
      >
        <Text style={[segmentStyles.tabText, activeTab === 'activity' && segmentStyles.tabTextActive]}>
          Activity
        </Text>
      </Pressable>
      <Pressable
        style={segmentStyles.tab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('matches');
        }}
      >
        <Text style={[segmentStyles.tabText, activeTab === 'matches' && segmentStyles.tabTextActive]}>
          Matches
        </Text>
      </Pressable>
    </View>
  );
}

const segmentStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.cardSecondary,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 140,
    height: 36,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

// Match card component
interface MatchCardProps {
  match: Match;
  onConfirm: () => void;
  onDispute: () => void;
  index: number;
  isHighlighted?: boolean;
}

function MatchCard({ match, onConfirm, onDispute, index, isHighlighted }: MatchCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const scale = useSharedValue(1);

  // Update countdown timer for pending matches
  useEffect(() => {
    if (match.status !== 'pending') return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = match.expiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [match.status, match.expiresAt]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  // Get status pill config
  const getStatusConfig = (status: MatchStatus) => {
    switch (status) {
      case 'pending':
        return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', text: 'Pending' };
      case 'confirmed':
        return { color: colors.accent, bg: 'rgba(57, 255, 20, 0.15)', text: 'Confirmed' };
      case 'disputed':
        return { color: colors.red, bg: 'rgba(239, 68, 68, 0.15)', text: 'Disputed' };
      case 'expired':
        return { color: colors.textMuted, bg: 'rgba(255, 255, 255, 0.08)', text: 'Expired' };
    }
  };

  const statusConfig = getStatusConfig(match.status);
  const isWin = match.teamAWins > match.teamBWins;
  const scoreDisplay = `${match.teamAWins}–${match.teamBWins}`;

  // Format timestamp
  const getTimeLabel = () => {
    const now = Date.now();
    const diff = now - match.createdAt;
    if (diff < 60000) return 'Just now';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Check if current user needs to confirm
  const needsConfirmation = match.status === 'pending';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={animatedStyle}
    >
      <AnimatedPressable
        style={[
          cardStyles.container,
          isHighlighted && cardStyles.containerHighlighted,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Left: Opponent avatars */}
        <View style={cardStyles.avatarSection}>
          {match.teamB.slice(0, 2).map((opponent, i) => (
            <Image
              key={opponent.id}
              source={{ uri: opponent.avatarUrl || 'https://i.pravatar.cc/150' }}
              style={[
                cardStyles.avatar,
                i > 0 && cardStyles.avatarOverlap,
              ]}
            />
          ))}
        </View>

        {/* Center: Match info */}
        <View style={cardStyles.infoSection}>
          <Text style={cardStyles.opponentName} numberOfLines={1}>
            {match.teamB.map(o => o.name.split(' ')[0]).join(' & ')}
          </Text>
          <Text style={cardStyles.matchMeta}>
            {match.mode === 'singles' ? 'Singles' : 'Doubles'} · {match.courtName}
          </Text>
          <View style={cardStyles.scoreRow}>
            <Text style={[cardStyles.score, isWin ? cardStyles.scoreWin : cardStyles.scoreLoss]}>
              {scoreDisplay}
            </Text>
            <Text style={cardStyles.timestamp}>{getTimeLabel()}</Text>
          </View>
        </View>

        {/* Right: Status */}
        <View style={cardStyles.statusSection}>
          <View style={[cardStyles.statusPill, { backgroundColor: statusConfig.bg }]}>
            <Text style={[cardStyles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
          {match.status === 'pending' && (
            <View style={cardStyles.expiresRow}>
              <Clock size={10} color={colors.textMuted} />
              <Text style={cardStyles.expiresText}>{timeRemaining}</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>

      {/* Confirmation actions for pending matches */}
      {needsConfirmation && (
        <View style={cardStyles.actionsRow}>
          <Pressable
            style={cardStyles.confirmButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onConfirm();
            }}
          >
            <Check size={14} color={colors.black} />
            <Text style={cardStyles.confirmButtonText}>Confirm</Text>
          </Pressable>
          <Pressable
            style={cardStyles.disputeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDispute();
            }}
          >
            <Flag size={12} color={colors.textMuted} />
            <Text style={cardStyles.disputeButtonText}>Dispute</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  containerHighlighted: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  avatarSection: {
    flexDirection: 'row',
    marginRight: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  infoSection: {
    flex: 1,
  },
  opponentName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  matchMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreWin: {
    color: colors.accent,
  },
  scoreLoss: {
    color: colors.red,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  expiresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  expiresText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  confirmButtonText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '600',
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  disputeButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});

// Collapsible section component
function CollapsibleSection({
  title,
  count,
  defaultExpanded = true,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (count === 0) return null;

  return (
    <View style={sectionStyles.container}>
      <Pressable
        style={sectionStyles.header}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsExpanded(!isExpanded);
        }}
      >
        <Text style={sectionStyles.title}>{title}</Text>
        <View style={sectionStyles.countBadge}>
          <Text style={sectionStyles.countText}>{count}</Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={16} color={colors.textMuted} />
        ) : (
          <ChevronDown size={16} color={colors.textMuted} />
        )}
      </Pressable>
      {isExpanded && children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});

// Dispute bottom sheet (simple version)
function DisputeSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 25, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const reasons = [
    { id: 'wrong_score', label: 'Wrong score' },
    { id: 'wrong_opponent', label: 'Wrong opponent' },
    { id: 'did_not_play', label: "Didn't play this match" },
    { id: 'other', label: 'Other issue' },
  ];

  if (!visible) return null;

  return (
    <View style={disputeStyles.container}>
      <Animated.View style={[disputeStyles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[disputeStyles.sheet, sheetStyle]}>
        <View style={disputeStyles.handle} />
        <Text style={disputeStyles.title}>Report an issue</Text>
        <Text style={disputeStyles.subtitle}>Select the reason for disputing this match</Text>

        {reasons.map(reason => (
          <Pressable
            key={reason.id}
            style={disputeStyles.reasonButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSubmit(reason.id);
            }}
          >
            <Text style={disputeStyles.reasonText}>{reason.label}</Text>
          </Pressable>
        ))}

        <Pressable style={disputeStyles.cancelButton} onPress={onClose}>
          <Text style={disputeStyles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const disputeStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  reasonButton: {
    backgroundColor: colors.cardSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reasonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});

// Main Activity Screen component
export function ActivityScreen({
  scrollToMatchId,
  onClearScrollTarget,
}: ActivityScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>('matches');
  const [refreshing, setRefreshing] = useState(false);
  const [disputeMatchId, setDisputeMatchId] = useState<string | null>(null);

  const {
    pendingMatches,
    confirmedMatches,
    disputedMatches,
    expiredMatches,
    confirmMatch,
    disputeMatch,
    checkExpiredMatches,
  } = useMatchStore();

  // Check for expired matches periodically
  useEffect(() => {
    checkExpiredMatches();
    const interval = setInterval(checkExpiredMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clear scroll target after rendering
  useEffect(() => {
    if (scrollToMatchId && onClearScrollTarget) {
      const timer = setTimeout(onClearScrollTarget, 2000);
      return () => clearTimeout(timer);
    }
  }, [scrollToMatchId, onClearScrollTarget]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    checkExpiredMatches();
    // TODO: Fetch from backend here
    setTimeout(() => setRefreshing(false), 500);
  }, [checkExpiredMatches]);

  const handleConfirm = (matchId: string) => {
    confirmMatch(matchId, 'current-user'); // TODO: Use real user ID
  };

  const handleDispute = (matchId: string) => {
    setDisputeMatchId(matchId);
  };

  const handleDisputeSubmit = (reason: string) => {
    if (disputeMatchId) {
      disputeMatch(disputeMatchId, reason);
      setDisputeMatchId(null);
    }
  };

  // Combine disputed and expired for collapsed section
  const archivedMatches = [...disputedMatches, ...expiredMatches];

  return (
    <View style={styles.container}>
      <SegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {activeTab === 'matches' ? (
          <>
            {/* Pending confirmation section - always at top */}
            <CollapsibleSection
              title="Pending confirmation"
              count={pendingMatches.length}
              defaultExpanded={true}
            >
              {pendingMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={index}
                  onConfirm={() => handleConfirm(match.id)}
                  onDispute={() => handleDispute(match.id)}
                  isHighlighted={match.id === scrollToMatchId}
                />
              ))}
            </CollapsibleSection>

            {/* Confirmed matches */}
            <CollapsibleSection
              title="Confirmed"
              count={confirmedMatches.length}
              defaultExpanded={true}
            >
              {confirmedMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={index}
                  onConfirm={() => {}}
                  onDispute={() => {}}
                  isHighlighted={match.id === scrollToMatchId}
                />
              ))}
            </CollapsibleSection>

            {/* Disputed/Expired - collapsed by default */}
            <CollapsibleSection
              title="Disputed & Expired"
              count={archivedMatches.length}
              defaultExpanded={false}
            >
              {archivedMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={index}
                  onConfirm={() => {}}
                  onDispute={() => {}}
                />
              ))}
            </CollapsibleSection>

            {/* Empty state */}
            {pendingMatches.length === 0 &&
              confirmedMatches.length === 0 &&
              archivedMatches.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No matches yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Log a match to see it here
                  </Text>
                </View>
              )}
          </>
        ) : (
          // Activity tab - placeholder for now
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Activity feed</Text>
            <Text style={styles.emptySubtitle}>
              Coming soon - see court activity and updates
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Dispute bottom sheet */}
      <DisputeSheet
        visible={disputeMatchId !== null}
        onClose={() => setDisputeMatchId(null)}
        onSubmit={handleDisputeSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
