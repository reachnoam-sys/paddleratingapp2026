import React, { useCallback, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutRectangle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../theme/colors';
import { DoublesSession, Player, TeamComboRecord, createTeamComboId } from '../types';

const AVATAR_SIZE = 60;

// Premium spring configs for buttery smooth animations
const DRAG_SPRING = { damping: 28, stiffness: 350, mass: 0.7 };
const SNAP_SPRING = { damping: 22, stiffness: 280, mass: 0.8 };
const SUBTLE_SPRING = { damping: 20, stiffness: 200, mass: 0.9 };

/**
 * TeamArrangementCard - Drag-and-drop UI for swapping doubles partners
 *
 * Displays 4 player avatars (2 per team) that can be dragged to swap positions.
 * Uses proximity-based targeting - dragged avatar swaps with closest opposite team player.
 *
 * @example
 * ```tsx
 * <TeamArrangementCard
 *   session={doublesSession}
 *   onArrangementChange={(teamA, teamB) => sessionStore.updateArrangement(teamA, teamB)}
 *   onLockTeams={() => sessionStore.lockTeams()}
 *   currentUserId={user.id}
 * />
 * ```
 */
interface TeamArrangementCardProps {
  /** Current doubles session with 4 players and team arrangement */
  session: DoublesSession;
  /** Called when players are swapped between teams */
  onArrangementChange: (teamA: [string, string], teamB: [string, string]) => void;
  /** Called when user confirms team arrangement */
  onLockTeams: () => void;
  /** Current user's ID (for visual distinction) */
  currentUserId: string;
}

interface AvatarPosition {
  playerId: string;
  team: 'A' | 'B';
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableAvatarProps {
  player: Player;
  index: number;
  team: 'A' | 'B';
  isCurrentUser: boolean;
  onDragStart: (playerId: string, team: 'A' | 'B') => void;
  onDragMove: (absoluteX: number, absoluteY: number, playerId: string) => void;
  onDragEnd: (playerId: string, fromTeam: 'A' | 'B', targetPlayerId: string | null) => void;
  onMeasure: (playerId: string, team: 'A' | 'B', index: number, layout: LayoutRectangle) => void;
  isDragging: boolean;
  isSwapTarget: boolean;
}

function DraggableAvatar({
  player,
  index,
  team,
  isCurrentUser,
  onDragStart,
  onDragMove,
  onDragEnd,
  onMeasure,
  isDragging,
  isSwapTarget,
}: DraggableAvatarProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const borderOpacity = useSharedValue(isCurrentUser ? 1 : 0);
  const viewRef = useRef<View>(null);

  // Subtle highlight animation for swap target
  React.useEffect(() => {
    if (isSwapTarget) {
      scale.value = withSpring(1.06, SUBTLE_SPRING);
      borderOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    } else if (!isDragging) {
      scale.value = withSpring(1, SNAP_SPRING);
      borderOpacity.value = withTiming(isCurrentUser ? 1 : 0, { duration: 250 });
    }
  }, [isSwapTarget, isDragging, isCurrentUser]);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDragStartJS = useCallback(() => {
    onDragStart(player.id, team);
  }, [player.id, team, onDragStart]);

  const handleDragMoveJS = useCallback(
    (absoluteX: number, absoluteY: number) => {
      onDragMove(absoluteX, absoluteY, player.id);
    },
    [player.id, onDragMove]
  );

  const handleDragEndJS = useCallback(
    (targetPlayerId: string | null) => {
      if (targetPlayerId) {
        triggerSuccessHaptic();
      }
      onDragEnd(player.id, team, targetPlayerId);
    },
    [team, player.id, onDragEnd, triggerSuccessHaptic]
  );

  // Measure position on layout
  const handleLayout = useCallback(() => {
    if (viewRef.current) {
      viewRef.current.measureInWindow((x, y, width, height) => {
        onMeasure(player.id, team, index, { x, y, width, height });
      });
    }
  }, [player.id, team, index, onMeasure]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      scale.value = withSpring(1.12, DRAG_SPRING);
      zIndex.value = 100;
      runOnJS(triggerHaptic)();
      runOnJS(handleDragStartJS)();
    })
    .onUpdate((event) => {
      'worklet';
      // Smooth 1:1 drag feel
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(handleDragMoveJS)(event.absoluteX, event.absoluteY);
    })
    .onEnd(() => {
      'worklet';
      // Buttery smooth return
      translateX.value = withSpring(0, SNAP_SPRING);
      translateY.value = withSpring(0, SNAP_SPRING);
      scale.value = withSpring(1, SNAP_SPRING);
      zIndex.value = 0;
    })
    .onFinalize((event) => {
      'worklet';
      runOnJS(handleDragEndJS)(null);
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(57, 255, 20, ${borderOpacity.value})`,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        ref={viewRef}
        style={[styles.avatarContainer, animatedContainerStyle]}
        onLayout={handleLayout}
      >
        <Animated.Image
          source={{ uri: player.avatar }}
          style={[
            styles.avatar,
            animatedBorderStyle,
            index > 0 && styles.avatarOverlap,
          ]}
        />
        <Text style={styles.playerName} numberOfLines={1}>
          {isCurrentUser ? 'You' : player.name.split(' ')[0]}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

export function TeamArrangementCard({
  session,
  onArrangementChange,
  onLockTeams,
  currentUserId,
}: TeamArrangementCardProps) {
  const [teamALayout, setTeamALayout] = useState<LayoutRectangle | null>(null);
  const [teamBLayout, setTeamBLayout] = useState<LayoutRectangle | null>(null);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [draggingFromTeam, setDraggingFromTeam] = useState<'A' | 'B' | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);

  // Track individual avatar positions for precise targeting
  const avatarPositions = useRef<Map<string, AvatarPosition>>(new Map());

  // Get players by team
  const teamAPlayers = useMemo(() => {
    return session.teamA.map(id => session.players.find(p => p.id === id)!);
  }, [session.teamA, session.players]);

  const teamBPlayers = useMemo(() => {
    return session.teamB.map(id => session.players.find(p => p.id === id)!);
  }, [session.teamB, session.players]);

  // Get current team combo record
  const currentComboRecord = useMemo((): TeamComboRecord | undefined => {
    const comboId = createTeamComboId(...session.teamA);
    return session.comboRecords.find(r => r.id === comboId);
  }, [session.teamA, session.comboRecords]);

  // Store avatar position when measured
  const handleAvatarMeasure = useCallback(
    (playerId: string, team: 'A' | 'B', index: number, layout: LayoutRectangle) => {
      avatarPositions.current.set(playerId, {
        playerId,
        team,
        index,
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      });
    },
    []
  );

  // Find closest avatar from opposite team
  const findClosestTarget = useCallback(
    (absoluteX: number, absoluteY: number, fromTeam: 'A' | 'B'): string | null => {
      let closestId: string | null = null;
      let closestDistance = Infinity;

      avatarPositions.current.forEach((pos) => {
        // Only consider players from the opposite team
        if (pos.team === fromTeam) return;

        const centerX = pos.x + pos.width / 2;
        const centerY = pos.y + pos.height / 2;
        const distance = Math.sqrt(
          Math.pow(absoluteX - centerX, 2) + Math.pow(absoluteY - centerY, 2)
        );

        // Only target if within reasonable range (150px)
        if (distance < 150 && distance < closestDistance) {
          closestDistance = distance;
          closestId = pos.playerId;
        }
      });

      return closestId;
    },
    []
  );

  const handleDragStart = useCallback((playerId: string, team: 'A' | 'B') => {
    setDraggingPlayerId(playerId);
    setDraggingFromTeam(team);
  }, []);

  const handleDragMove = useCallback(
    (absoluteX: number, absoluteY: number, _playerId: string) => {
      if (!draggingFromTeam) return;

      const targetId = findClosestTarget(absoluteX, absoluteY, draggingFromTeam);

      if (targetId !== swapTargetId) {
        if (targetId) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setSwapTargetId(targetId);
      }
    },
    [draggingFromTeam, swapTargetId, findClosestTarget]
  );

  const handleDragEnd = useCallback(
    (playerId: string, fromTeam: 'A' | 'B', _targetPlayerId: string | null) => {
      // Use the current swapTargetId for the actual swap
      if (swapTargetId && draggingFromTeam) {
        const newTeamA = [...session.teamA] as [string, string];
        const newTeamB = [...session.teamB] as [string, string];

        const sourceTeam = fromTeam === 'A' ? newTeamA : newTeamB;
        const targetTeam = fromTeam === 'A' ? newTeamB : newTeamA;

        const sourceIndex = sourceTeam.indexOf(playerId);
        const targetIndex = targetTeam.indexOf(swapTargetId);

        if (sourceIndex !== -1 && targetIndex !== -1) {
          // Swap the players
          const temp = sourceTeam[sourceIndex];
          sourceTeam[sourceIndex] = targetTeam[targetIndex];
          targetTeam[targetIndex] = temp;
          onArrangementChange(newTeamA, newTeamB);
        }
      }

      setDraggingPlayerId(null);
      setDraggingFromTeam(null);
      setSwapTargetId(null);
    },
    [session.teamA, session.teamB, swapTargetId, draggingFromTeam, onArrangementChange]
  );

  const handleTeamALayout = useCallback((event: any) => {
    event.target.measureInWindow((x: number, y: number, width: number, height: number) => {
      setTeamALayout({ x, y, width, height });
    });
  }, []);

  const handleTeamBLayout = useCallback((event: any) => {
    event.target.measureInWindow((x: number, y: number, width: number, height: number) => {
      setTeamBLayout({ x, y, width, height });
    });
  }, []);

  const teamAName = teamAPlayers
    .map(p => (p.id === currentUserId ? 'You' : p.name.split(' ')[0]))
    .join(' + ');
  const teamBName = teamBPlayers
    .map(p => (p.id === currentUserId ? 'You' : p.name.split(' ')[0]))
    .join(' + ');

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.title}>Arrange teams</Text>
        </View>
        {currentComboRecord && (currentComboRecord.wins > 0 || currentComboRecord.losses > 0) && (
          <View style={styles.recordBadge}>
            <Text style={styles.recordText}>
              {currentComboRecord.wins}-{currentComboRecord.losses}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.hint}>Drag a player to swap teams</Text>

      <View style={styles.teamsRow}>
        <View
          style={[
            styles.teamSide,
            draggingFromTeam === 'B' && styles.teamSideHighlight,
          ]}
          onLayout={handleTeamALayout}
          collapsable={false}
        >
          <View style={styles.teamAvatars}>
            {teamAPlayers.map((player, idx) => (
              <DraggableAvatar
                key={player.id}
                player={player}
                index={idx}
                team="A"
                isCurrentUser={player.id === currentUserId}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onMeasure={handleAvatarMeasure}
                isDragging={draggingPlayerId === player.id}
                isSwapTarget={swapTargetId === player.id}
              />
            ))}
          </View>
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>vs</Text>
        </View>

        <View
          style={[
            styles.teamSide,
            draggingFromTeam === 'A' && styles.teamSideHighlight,
          ]}
          onLayout={handleTeamBLayout}
          collapsable={false}
        >
          <View style={styles.teamAvatars}>
            {teamBPlayers.map((player, idx) => (
              <DraggableAvatar
                key={player.id}
                player={player}
                index={idx}
                team="B"
                isCurrentUser={player.id === currentUserId}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onMeasure={handleAvatarMeasure}
                isDragging={draggingPlayerId === player.id}
                isSwapTarget={swapTargetId === player.id}
              />
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.matchup}>
        {teamAName} vs {teamBName}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.lockButton,
          pressed && styles.lockButtonPressed,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLockTeams();
        }}
      >
        <Text style={styles.lockButtonText}>Lock Teams & Play</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordBadge: {
    backgroundColor: `${colors.accent}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  recordText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.white}05`,
    minHeight: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamSideHighlight: {
    borderColor: `${colors.accent}25`,
    backgroundColor: `${colors.accent}05`,
  },
  teamAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  avatarOverlap: {
    marginLeft: -16,
  },
  playerName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing.sm,
    maxWidth: AVATAR_SIZE + 16,
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: spacing.sm,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  matchup: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  lockButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  lockButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  lockButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
