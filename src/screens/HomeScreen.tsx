import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Header,
  PlayerCard,
  TeamCard,
  LookingForPartnerCard,
  JoinedPlayerCard,
  MatchReadyCard,
  RecentMatchCard,
  LogMatchSheet,
  LogMatchGrabHandle,
  PendingChallengeCard,
  ProfileSidebar,
  ProfileScreen,
  BottomNavBar,
  StatusSelectorModal,
  InviteBottomSheet,
  MatchResultOverlay,
  CheckInStatusPill,
  MatchTypeSheet,
  MatchSubmittedModal,
  ActivityScreen,
  PairCard,
  SwitchToSinglesSheet,
  TeamArrangementCard,
  PlayerActionSheet,
  TeamPreviewSheet,
} from '../components';
import type { PresenceStatus, MatchType, PairStatus } from '../components';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useNearbyPlayers, useTeams, useCurrentUser } from '../hooks';
import { eloToRating, getNewElo } from '../utils';
import type { Player, Team, GameMode, PlayPreference } from '../types';
import { useMatchStore, playersToParticipants, Match, useSessionStore } from '../store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Dev fixture data
const DEV_FIXTURE_USER: Player = {
  id: 'dev-user',
  name: 'Dev User',
  avatar: 'https://i.pravatar.cc/150?u=devuser',
  elo: 1420,
  status: 'Ready',
};

const DEV_FIXTURE_PARTNER: Player = {
  id: 'dev-partner',
  name: 'Dev Partner',
  avatar: 'https://i.pravatar.cc/150?u=devpartner',
  elo: 1400,
  status: 'Ready',
};

const DEV_FIXTURE_OPPONENTS: Player[] = [
  { id: 'dev-opp1', name: 'Opponent One', avatar: 'https://i.pravatar.cc/150?u=devopp1', elo: 1350, status: 'Ready' },
  { id: 'dev-opp2', name: 'Opponent Two', avatar: 'https://i.pravatar.cc/150?u=devopp2', elo: 1380, status: 'Ready' },
];

type DevSessionState = 'NONE' | 'MATCH_READY' | 'RECENT_MATCH' | 'LOG_PROMPT_OPEN';

// Dev Panel Component
function DevPanel({
  sessionState,
  minutesSinceFormed,
  nudgeGlowEnabled,
  onSessionStateChange,
  onMinutesChange,
  onNudgeGlowToggle,
  onClose,
}: {
  sessionState: DevSessionState;
  minutesSinceFormed: number;
  nudgeGlowEnabled: boolean;
  onSessionStateChange: (state: DevSessionState) => void;
  onMinutesChange: (minutes: number) => void;
  onNudgeGlowToggle: () => void;
  onClose: () => void;
}) {
  const states: DevSessionState[] = ['NONE', 'MATCH_READY', 'RECENT_MATCH', 'LOG_PROMPT_OPEN'];
  const minuteOptions = [0, 5, 15, 45];

  return (
    <View style={devStyles.overlay}>
      <View style={devStyles.panel}>
        <View style={devStyles.header}>
          <Text style={devStyles.title}>Dev State Switcher</Text>
          <Pressable onPress={onClose} style={devStyles.closeBtn}>
            <Text style={devStyles.closeBtnText}>×</Text>
          </Pressable>
        </View>

        <Text style={devStyles.label}>Session State</Text>
        <View style={devStyles.optionsRow}>
          {states.map((state) => (
            <Pressable
              key={state}
              style={[devStyles.option, sessionState === state && devStyles.optionActive]}
              onPress={() => onSessionStateChange(state)}
            >
              <Text style={[devStyles.optionText, sessionState === state && devStyles.optionTextActive]}>
                {state}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={devStyles.label}>Minutes Since Formed</Text>
        <View style={devStyles.optionsRow}>
          {minuteOptions.map((mins) => (
            <Pressable
              key={mins}
              style={[devStyles.option, minutesSinceFormed === mins && devStyles.optionActive]}
              onPress={() => onMinutesChange(mins)}
            >
              <Text style={[devStyles.optionText, minutesSinceFormed === mins && devStyles.optionTextActive]}>
                {mins}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={devStyles.label}>5-Min Nudge Glow</Text>
        <View style={devStyles.optionsRow}>
          <Pressable
            style={[devStyles.option, nudgeGlowEnabled && devStyles.optionActive]}
            onPress={onNudgeGlowToggle}
          >
            <Text style={[devStyles.optionText, nudgeGlowEnabled && devStyles.optionTextActive]}>
              {nudgeGlowEnabled ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const devStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#666',
    fontSize: 24,
    lineHeight: 24,
  },
  label: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  optionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
});

export function HomeScreen() {
  // Default to doubles experience
  const [gameMode, setGameMode] = useState<GameMode>('doubles');
  const [invitedPlayerIds, setInvitedPlayerIds] = useState<Set<string>>(new Set());
  const [acceptedPlayerIds, setAcceptedPlayerIds] = useState<Set<string>>(new Set());
  const [challengedTeam, setChallengedTeam] = useState<Team | null>(null);
  const [acceptedTeam, setAcceptedTeam] = useState<Team | null>(null);
  const [challengedPlayer, setChallengedPlayer] = useState<Player | null>(null);
  const [acceptedPlayer, setAcceptedPlayer] = useState<Player | null>(null);
  const [singlesCooldownPlayerId, setSinglesCooldownPlayerId] = useState<string | null>(null);
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [showScoreFlow, setShowScoreFlow] = useState(false);
  const [matchReadyTime, setMatchReadyTime] = useState<Date | null>(null);
  const [recentMatch, setRecentMatch] = useState<{ partner: Player; opponents: Player[] } | null>(null);
  const [isNewMatchAnimation, setIsNewMatchAnimation] = useState(true);
  const [cooldownTeamId, setCooldownTeamId] = useState<string | null>(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'profile'>('home');
  // Top-level presence status (single source of truth)
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('not_checked_in');
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(true);
  const [playPreference, setPlayPreference] = useState<PlayPreference>('Either');
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [nextGameRequestedIds, setNextGameRequestedIds] = useState<Set<string>>(new Set());
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  // Match type sheet state
  const [showMatchTypeSheet, setShowMatchTypeSheet] = useState(false);
  const [matchTypeSheetPlayer, setMatchTypeSheetPlayer] = useState<Player | null>(null);
  const [lastMatchTypeSelection, setLastMatchTypeSelection] = useState<MatchType>('doubles');
  // Player action sheet state (for solo players)
  const [actionSheetPlayer, setActionSheetPlayer] = useState<Player | null>(null);
  // Switch to singles confirmation sheet
  const [showSwitchToSinglesSheet, setShowSwitchToSinglesSheet] = useState(false);
  // Team preview sheet state
  const [showTeamPreview, setShowTeamPreview] = useState(false);
  // Derived from presenceStatus for backward compatibility
  const isCheckedIn = presenceStatus !== 'not_checked_in';
  const isAvailable = presenceStatus === 'available';
  const isOnCourt = presenceStatus === 'on_court';
  const isMatching = presenceStatus === 'waiting';
  const queuePosition = presenceStatus === 'waiting' ? 3 : undefined; // Mock queue position

  // Dev mode state (only used in __DEV__)
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devSessionState, setDevSessionState] = useState<DevSessionState>('NONE');
  const [devMinutesSinceFormed, setDevMinutesSinceFormed] = useState(0);
  const [devNudgeGlowEnabled, setDevNudgeGlowEnabled] = useState(false);

  // Match result overlay state (legacy - kept for old result overlay)
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    isWin: boolean;
    previousElo: number;
    newElo: number;
    opponents: Player[];
    timestamp: Date;
  } | null>(null);
  // Track newly logged matches for Activity highlighting
  const [newlyLoggedMatchId, setNewlyLoggedMatchId] = useState<string | null>(null);

  // Match submission state (new flow)
  const [showMatchSubmitted, setShowMatchSubmitted] = useState(false);
  const [submittedMatch, setSubmittedMatch] = useState<Match | null>(null);
  const [scrollToMatchId, setScrollToMatchId] = useState<string | null>(null);

  // Get match store data
  const { pendingConfirmationCount, createMatch } = useMatchStore();

  // Get session store for doubles team swapping
  const {
    session: doublesSession,
    startSession,
    updateArrangement,
    lockTeams,
    unlockTeams,
    recordGame,
    endSession,
  } = useSessionStore();

  // Use custom hooks for data fetching
  const { user, currentTeam, invitePartner, leaveTeam } = useCurrentUser();
  const { players, loading: playersLoading } = useNearbyPlayers();
  const { teams, lookingForPartner: allLookingForPartner, loading: teamsLoading } = useTeams();

  // Filter out the current team's partner from the looking for partner list
  const lookingForPartner = React.useMemo(() => {
    if (!currentTeam) return allLookingForPartner;
    return allLookingForPartner.filter(p => p.id !== currentTeam.partner.id);
  }, [allLookingForPartner, currentTeam]);

  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (gameMode === 'doubles') {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [gameMode]);

  // Dev mode overrides
  const isDevMode = __DEV__ && devSessionState !== 'NONE';

  // Compute if match is ready
  // Singles: user + acceptedPlayer
  // Doubles: your team + 2 accepted players OR accepted team
  const isMatchReady = React.useMemo(() => {
    if (isDevMode) {
      return devSessionState === 'MATCH_READY' || devSessionState === 'LOG_PROMPT_OPEN';
    }
    // Singles match ready when opponent accepts
    if (gameMode === 'singles' && acceptedPlayer) {
      return true;
    }
    // Doubles match ready
    return currentTeam && (acceptedPlayerIds.size >= 2 || acceptedTeam);
  }, [currentTeam, acceptedPlayerIds, acceptedTeam, acceptedPlayer, gameMode, isDevMode, devSessionState]);

  // Track when match becomes ready, detect if it's a "last game" state
  React.useEffect(() => {
    if (isMatchReady && !matchReadyTime && !isDevMode) {
      setMatchReadyTime(new Date());
    } else if (!isMatchReady && !isDevMode) {
      setMatchReadyTime(null);
    }
  }, [isMatchReady, isDevMode]);

  // Consider it a "last game" if match has been ready for more than 2 minutes
  const isLastGame = React.useMemo(() => {
    if (isDevMode) {
      return devMinutesSinceFormed >= 2;
    }
    if (!matchReadyTime) return false;
    const elapsed = Date.now() - matchReadyTime.getTime();
    return elapsed > 2 * 60 * 1000; // 2 minutes
  }, [matchReadyTime, isDevMode, devMinutesSinceFormed]);

  // Check if user has a pending challenge (team accepted but user needs partner)
  const hasPendingChallenge = React.useMemo(() => {
    return acceptedTeam && !currentTeam;
  }, [acceptedTeam, currentTeam]);

  // Get opponent players for match ready display
  const opponentPlayers = React.useMemo((): Player[] => {
    if (isDevMode) {
      return DEV_FIXTURE_OPPONENTS;
    }
    if (acceptedTeam) {
      return [
        { id: 't1p1', name: acceptedTeam.player1.name, avatar: acceptedTeam.player1.avatar, elo: acceptedTeam.player1.elo ?? 1200, status: 'Ready' as const },
        { id: 't1p2', name: acceptedTeam.player2.name, avatar: acceptedTeam.player2.avatar, elo: acceptedTeam.player2.elo ?? 1200, status: 'Ready' as const },
      ];
    }
    return lookingForPartner.filter(p => acceptedPlayerIds.has(p.id)).slice(0, 2);
  }, [acceptedTeam, lookingForPartner, acceptedPlayerIds, isDevMode]);

  // Dev mode: compute recentMatch from fixture data
  const effectiveRecentMatch = React.useMemo(() => {
    if (isDevMode && devSessionState === 'RECENT_MATCH') {
      return { partner: DEV_FIXTURE_PARTNER, opponents: DEV_FIXTURE_OPPONENTS };
    }
    return recentMatch;
  }, [isDevMode, devSessionState, recentMatch]);

  // Dev mode: sync showLogPrompt with LOG_PROMPT_OPEN state
  React.useEffect(() => {
    if (isDevMode && devSessionState === 'LOG_PROMPT_OPEN') {
      setShowLogPrompt(true);
    }
  }, [isDevMode, devSessionState]);

  // Effective user/partner for dev mode (convert CurrentUser to Player if needed)
  const effectiveUser: Player | null = isDevMode
    ? DEV_FIXTURE_USER
    : user
      ? { ...user, status: 'Ready' as const }
      : null;
  const effectivePartner = isDevMode ? DEV_FIXTURE_PARTNER : currentTeam?.partner;

  // Start a doubles session when match is ready with 4 players
  React.useEffect(() => {
    if (
      isMatchReady &&
      gameMode === 'doubles' &&
      effectiveUser &&
      effectivePartner &&
      opponentPlayers.length === 2 &&
      !doublesSession
    ) {
      const allPlayers = [effectiveUser, effectivePartner, ...opponentPlayers];
      startSession({
        courtId: 'lincoln-park',
        courtName: 'Lincoln Park Courts',
        players: allPlayers,
      });
    }
  }, [isMatchReady, gameMode, effectiveUser, effectivePartner, opponentPlayers, doublesSession, startSession]);

  // Clean up session when match is cancelled
  React.useEffect(() => {
    if (!isMatchReady && doublesSession) {
      endSession();
    }
  }, [isMatchReady, doublesSession, endSession]);

  // For display in header
  const currentUserDisplay = user
    ? {
        avatar: user.avatar,
        elo: eloToRating(user.elo),
        eloNumber: user.elo,
      }
    : {
        avatar: '',
        elo: '3.0',
        eloNumber: 1200,
      };

  // Open match type sheet when user taps "Play" on a player card
  const handlePlayPress = (player: Player) => {
    setMatchTypeSheetPlayer(player);
    setShowMatchTypeSheet(true);
  };

  // Handle doubles selection from match type sheet
  const handleSelectDoubles = (player: Player) => {
    setLastMatchTypeSelection('doubles');
    setShowMatchTypeSheet(false);
    setMatchTypeSheetPlayer(null);
    // Partner up with the selected player
    console.log('Partner request sent to:', player.name);
    invitePartner(player);
  };

  // Handle singles selection from match type sheet
  const handleSelectSingles = (player: Player) => {
    setLastMatchTypeSelection('singles');
    setShowMatchTypeSheet(false);
    setMatchTypeSheetPlayer(null);
    // Direct 1v1 challenge
    setGameMode('singles');
    handleChallengeSingles(player);
  };

  // Singles challenge flow (1v1)
  const handleChallengeSingles = (player: Player) => {
    console.log('Challenge player (singles):', player);
    setChallengedPlayer(player);
    // Simulate player accepting after 2 seconds (for demo purposes)
    setTimeout(() => {
      setChallengedPlayer(null);
      setAcceptedPlayer(player);
    }, 2000);
  };

  const handleChallengeTeam = (team: Team) => {
    console.log('Challenge team:', team);
    setChallengedTeam(team);
    // Simulate team accepting after 2 seconds (for demo purposes)
    setTimeout(() => {
      setChallengedTeam(null);
      setAcceptedTeam(team);
    }, 2000);
  };

  const handleCancelInvite = (player: Player) => {
    console.log('Cancel invite:', player.name);
    setInvitedPlayerIds(prev => {
      const next = new Set(prev);
      next.delete(player.id);
      return next;
    });
  };

  const handleLeaveTeam = async () => {
    await leaveTeam();
  };

  const handleCancelMatch = () => {
    // Set cooldown for the cancelled team (doubles)
    if (acceptedTeam) {
      setCooldownTeamId(acceptedTeam.id);
      setTimeout(() => {
        setCooldownTeamId(null);
      }, 5000);
    }
    // Set cooldown for cancelled player (singles)
    if (acceptedPlayer) {
      setSinglesCooldownPlayerId(acceptedPlayer.id);
      setTimeout(() => {
        setSinglesCooldownPlayerId(null);
      }, 5000);
    }
    // Clear doubles state
    setAcceptedPlayerIds(new Set());
    setAcceptedTeam(null);
    setInvitedPlayerIds(new Set());
    setChallengedTeam(null);
    // Clear singles state
    setChallengedPlayer(null);
    setAcceptedPlayer(null);
    setIsNewMatchAnimation(true); // Reset animation for next match
  };

  const handleFindAnotherGame = () => {
    setShowLogPrompt(true);
  };

  const handleSkipLog = () => {
    setShowLogPrompt(false);
    handleCancelMatch();
  };

  const handleLogScores = () => {
    setShowLogPrompt(false);
    setShowScoreFlow(true);
  };

  // Recent match handlers
  const handleRecentMatchPlayAgain = () => {
    setShowLogPrompt(true);
  };

  const handleRecentMatchLogScore = () => {
    setShowScoreFlow(true);
  };

  const handleRecentMatchDismiss = () => {
    setRecentMatch(null);
  };

  const handleRecentMatchSkip = () => {
    setShowLogPrompt(false);
    setRecentMatch(null);
  };

  const handleRecentMatchLog = () => {
    setShowLogPrompt(false);
    setShowScoreFlow(true);
  };

  const handleScoreFlowComplete = (games: { teamAScore: number; teamBScore: number }[]) => {
    setShowScoreFlow(false);

    // Get opponents for the match
    const currentOpponents = gameMode === 'singles'
      ? (acceptedPlayer ? [acceptedPlayer] : [])
      : opponentPlayers;

    // Build team A (user's team)
    const teamAPlayers: Player[] = [];
    if (user) {
      teamAPlayers.push({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        elo: user.elo,
        status: 'Ready',
      });
    }
    if (gameMode === 'doubles' && currentTeam?.partner) {
      teamAPlayers.push(currentTeam.partner);
    }

    // Create match in store with W-L record
    const match = createMatch({
      courtId: 'lincoln-park',
      courtName: 'Lincoln Park',
      mode: gameMode,
      teamA: playersToParticipants(teamAPlayers),
      teamB: playersToParticipants(currentOpponents),
      games: games.map(g => ({ teamAScore: g.teamAScore, teamBScore: g.teamBScore })),
      currentUserId: user?.id ?? 'current-user',
    });

    // If in a doubles session, record the game to update combo records
    // This will transition back to 'arranging' phase for team swapping
    if (doublesSession && games.length > 0) {
      // Record the most recent game (last in array if multiple)
      const lastGame = games[games.length - 1];
      recordGame(lastGame.teamAScore, lastGame.teamBScore);
    }

    // Store match and show submitted modal
    setSubmittedMatch(match);
    setShowMatchSubmitted(true);
    setScrollToMatchId(match.id);

    // Clear match state WITHOUT triggering cooldown (not a cancel)
    // This is a successful submission, so just clear the match-in-progress state
    setAcceptedPlayerIds(new Set());
    setAcceptedTeam(null);
    setInvitedPlayerIds(new Set());
    setChallengedTeam(null);
    setChallengedPlayer(null);
    setAcceptedPlayer(null);
    setIsNewMatchAnimation(true);
    setRecentMatch(null);
  };

  // Handle closing the match submitted modal - go back to court
  const handleMatchSubmittedClose = () => {
    setShowMatchSubmitted(false);
    setSubmittedMatch(null);
  };

  // Handle viewing activity from match submitted modal
  const handleMatchSubmittedViewActivity = () => {
    setShowMatchSubmitted(false);
    setSubmittedMatch(null);
    setActiveTab('activity');
  };

  // Legacy handlers for old MatchResultOverlay (if still used elsewhere)
  const handleMatchResultClose = () => {
    setShowMatchResult(false);
    setMatchResult(null);
    handleCancelMatch();
    setRecentMatch(null);
  };

  const handleViewActivity = () => {
    setShowMatchResult(false);
    setMatchResult(null);
    handleCancelMatch();
    setRecentMatch(null);
    // Switch to activity tab
    setActiveTab('activity');
  };

  // Handle game mode transitions with smart state preservation
  const handleGameModeChange = async (newMode: GameMode) => {
    // Switching from Doubles to Singles
    if (gameMode === 'doubles' && newMode === 'singles') {
      // If user has a partner, auto-transition to singles match vs partner
      if (currentTeam) {
        const partner = currentTeam.partner;
        // Leave the team first
        await leaveTeam();
        // Clear doubles state
        setAcceptedTeam(null);
        setChallengedTeam(null);
        setAcceptedPlayerIds(new Set());
        setInvitedPlayerIds(new Set());
        // Switch to singles and set up match against former partner
        setGameMode(newMode);
        // Auto-accept the partner as opponent (skip challenge animation)
        setAcceptedPlayer(partner);
        return;
      }
    }

    // Switching from Singles to Doubles
    if (gameMode === 'singles' && newMode === 'doubles') {
      // If user has an accepted opponent, auto-form team with them
      if (acceptedPlayer) {
        // Auto-form team with the accepted player
        invitePartner(acceptedPlayer);
        // Clear singles state
        setChallengedPlayer(null);
        setAcceptedPlayer(null);
        setGameMode(newMode);
        return;
      }
    }

    // Default: just switch modes
    setGameMode(newMode);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  // Handle check-in - sets presence to available
  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPresenceStatus('available');
  };

  // Handle status change from modal
  const handleStatusChange = (newStatus: PresenceStatus) => {
    setPresenceStatus(newStatus);
  };

  // Handle request next game toggle
  const handleRequestNextGame = (player: Player) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNextGameRequestedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(player.id)) {
        newSet.delete(player.id);
      } else {
        newSet.add(player.id);
      }
      return newSet;
    });
  };

  // Handle solo player tap - opens action sheet
  const handleSoloPlayerTap = (player: Player) => {
    setActionSheetPlayer(player);
  };

  // Handle partner up from action sheet
  const handleActionSheetPartnerUp = (player: Player) => {
    setActionSheetPlayer(null);
    invitePartner(player);
  };

  // Handle play singles from action sheet
  const handleActionSheetPlaySingles = (player: Player) => {
    setActionSheetPlayer(null);
    setGameMode('singles');
    handleChallengeSingles(player);
  };

  const isLoading = gameMode === 'singles' ? playersLoading : teamsLoading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <Header
        userAvatar={currentUserDisplay.avatar}
        locationName="Lincoln Park Courts"
        partnerAvatar={isDevMode ? DEV_FIXTURE_PARTNER.avatar : currentTeam?.partner.avatar}
        onLeaveTeam={handleLeaveTeam}
        onTeamPress={() => setShowTeamPreview(true)}
        isMatchInProgress={!!isMatchReady}
        onCancelMatch={handleCancelMatch}
        onLongPressLocation={__DEV__ ? () => setShowDevPanel(true) : undefined}
        onProfilePress={() => setShowProfileSidebar(true)}
        onSharePress={() => setShowInviteSheet(true)}
        notificationCount={3}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Court stats - premium activity display */}
        {!isMatchReady && (
          <View style={styles.courtStatsCard}>
            <View style={styles.courtStatsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statCount, styles.statCountPlaying]}>
                  {players.filter(p => p.status.startsWith('On Court')).length}
                </Text>
                <Text style={styles.statLabel}>playing</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statCount, styles.statCountReady]}>
                  {players.filter(p => p.status === 'Ready' || p.status === 'Available' || p.status === 'Waiting').length}
                </Text>
                <Text style={styles.statLabel}>ready</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statCount, styles.statCountArriving]}>
                  {2}
                </Text>
                <Text style={styles.statLabel}>arriving</Text>
              </View>
            </View>
          </View>
        )}

        {/* Top-level Check-in Status Pill */}
        {!isMatchReady && (
          <View style={styles.checkInContainer}>
            <CheckInStatusPill
              status={presenceStatus}
              onCheckIn={handleCheckIn}
              onStatusPress={() => setShowStatusSelector(true)}
              autoMatchEnabled={autoMatchEnabled}
            />
          </View>
        )}

        {/* Pair Card - shown when user has a partner (doubles) or opponent (singles) */}
        {!isMatchReady && isCheckedIn && (currentTeam || acceptedPlayer) && (
          <View style={styles.pairCardContainer}>
            <PairCard
              player={gameMode === 'singles' && acceptedPlayer ? acceptedPlayer : (currentTeam?.partner ?? acceptedPlayer!)}
              mode={gameMode === 'singles' ? 'singles' : 'doubles'}
              status={currentTeam || acceptedPlayer ? 'paired' : 'pending'}
              onUnpair={() => {
                if (gameMode === 'singles') {
                  setAcceptedPlayer(null);
                  setChallengedPlayer(null);
                } else {
                  handleLeaveTeam();
                }
              }}
              onSwitchToSingles={gameMode === 'doubles' && currentTeam ? () => setShowSwitchToSinglesSheet(true) : undefined}
            />
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <>
            {gameMode === 'singles' && (
              <View style={styles.cardsContainer}>
                {/* Singles Match Ready */}
                {isMatchReady && effectiveUser && acceptedPlayer && (
                  <View style={styles.matchReadyContainer}>
                    {/* Switch to Doubles button above match card */}
                    <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                      <Pressable
                        style={styles.switchModeButton}
                        onPress={() => handleGameModeChange('doubles')}
                      >
                        <Text style={styles.switchModeText}>Switch to Doubles</Text>
                      </Pressable>
                    </Animated.View>

                    <MatchReadyCard
                      teamA={[effectiveUser]}
                      teamB={[acceptedPlayer]}
                      onCancelMatch={handleCancelMatch}
                      onForfeit={handleCancelMatch}
                      onSubmitScore={handleLogScores}
                      isLastGame={isLastGame}
                      isNewMatch={isNewMatchAnimation}
                      __devTriggerNudge={devNudgeGlowEnabled}
                    />

                    {/* Grab handle for swipe-up log drawer */}
                    {!showLogPrompt && (
                      <LogMatchGrabHandle onPress={() => setShowScoreFlow(true)} />
                    )}
                  </View>
                )}

                {/* Player cards - hidden when match ready */}
                {!isMatchReady && players.map((player, index) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onChallenge={handlePlayPress}
                    onRequestNextGame={handleRequestNextGame}
                    isChallenged={challengedPlayer?.id === player.id}
                    isAcceptedByMe={acceptedPlayer?.id === player.id}
                    isCooldown={singlesCooldownPlayerId === player.id}
                    isNextGameRequested={nextGameRequestedIds.has(player.id)}
                    index={index}
                  />
                ))}
              </View>
            )}

            {gameMode === 'doubles' && (
              <View style={styles.cardsContainer}>
                {/* Team Arrangement - show when session is in arranging phase */}
                {isMatchReady && doublesSession?.phase === 'arranging' && (
                  <View style={styles.matchReadyContainer}>
                    <TeamArrangementCard
                      session={doublesSession}
                      onArrangementChange={updateArrangement}
                      onLockTeams={lockTeams}
                      currentUserId={user?.id ?? 'current-user'}
                    />
                  </View>
                )}

                {/* Match Ready - show when session is in ready phase (teams locked) */}
                {isMatchReady && doublesSession?.phase === 'ready' && effectiveUser && effectivePartner && (
                  <View style={styles.matchReadyContainer}>
                    <MatchReadyCard
                      teamA={[effectiveUser, effectivePartner]}
                      teamB={opponentPlayers}
                      onCancelMatch={handleCancelMatch}
                      onForfeit={handleCancelMatch}
                      onSubmitScore={handleLogScores}
                      isLastGame={isLastGame}
                      isNewMatch={isNewMatchAnimation}
                      onRearrangeTeams={unlockTeams}
                      __devTriggerNudge={devNudgeGlowEnabled}
                    />

                    {/* Grab handle for swipe-up log drawer */}
                    {!showLogPrompt && (
                      <LogMatchGrabHandle onPress={() => setShowScoreFlow(true)} />
                    )}

                    {/* Legacy log prompt bottom sheet (kept for backward compatibility) */}
                    {showLogPrompt && (
                      <View style={styles.logPromptSheet}>
                        <Text style={styles.logPromptTitle}>Log last game?</Text>
                        <Text style={styles.logPromptBody}>
                          You played with {[...opponentPlayers, effectivePartner].map(p => p.name.split(' ')[0]).join(', ')}.
                        </Text>
                        <Pressable style={styles.logPromptPrimary} onPress={handleLogScores}>
                          <Text style={styles.logPromptPrimaryText}>Log scores</Text>
                        </Pressable>
                        <Pressable style={styles.logPromptSecondary} onPress={handleSkipLog}>
                          <Text style={styles.logPromptSecondaryText}>Skip and play again</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}

                {/* Fallback: Match Ready without session (legacy behavior) */}
                {isMatchReady && !doublesSession && effectiveUser && effectivePartner && (
                  <View style={styles.matchReadyContainer}>
                    <MatchReadyCard
                      teamA={[effectiveUser, effectivePartner]}
                      teamB={opponentPlayers}
                      onCancelMatch={handleCancelMatch}
                      onForfeit={handleCancelMatch}
                      onSubmitScore={handleLogScores}
                      isLastGame={isLastGame}
                      isNewMatch={isNewMatchAnimation}
                      __devTriggerNudge={devNudgeGlowEnabled}
                    />

                    {/* Grab handle for swipe-up log drawer */}
                    {!showLogPrompt && (
                      <LogMatchGrabHandle onPress={() => setShowScoreFlow(true)} />
                    )}
                  </View>
                )}

                {/* Recent Match - show when there's a recent match to log */}
                {!isMatchReady && effectiveRecentMatch && effectiveUser && (
                  <>
                    <RecentMatchCard
                      user={effectiveUser}
                      partner={effectiveRecentMatch.partner}
                      opponents={effectiveRecentMatch.opponents}
                      onPlayAgain={handleRecentMatchPlayAgain}
                      onLogScore={handleRecentMatchLogScore}
                      onDismiss={handleRecentMatchDismiss}
                    />

                    {/* Log prompt for recent match */}
                    {showLogPrompt && (
                      <View style={styles.recentMatchLogSheet}>
                        <Text style={styles.logPromptTitle}>Log last match?</Text>
                        <Text style={styles.logPromptBody}>
                          You played with {effectiveRecentMatch.partner.name.split(' ')[0]}, {effectiveRecentMatch.opponents.map(p => p.name.split(' ')[0]).join(', and ')}.
                        </Text>
                        <Pressable style={styles.logPromptPrimary} onPress={handleRecentMatchLog}>
                          <Text style={styles.logPromptPrimaryText}>Log scores</Text>
                        </Pressable>
                        <Pressable style={styles.logPromptSecondary} onPress={handleRecentMatchSkip}>
                          <Text style={styles.logPromptSecondaryText}>Skip</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}

                {/* All discovery sections - hidden when match ready or recent match */}
                {!isMatchReady && !effectiveRecentMatch && (
                  <>
                    {/* Pending game - show when team accepted but user needs partner */}
                    {hasPendingChallenge && acceptedTeam && (
                      <>
                        <Text style={styles.sectionTitle}>Pending Game</Text>
                        <PendingChallengeCard
                          acceptedTeam={acceptedTeam}
                          onCancelChallenge={handleCancelMatch}
                        />
                      </>
                    )}

                    {/* Game Forming Section */}
                    {currentTeam && lookingForPartner.some(p => invitedPlayerIds.has(p.id) || acceptedPlayerIds.has(p.id)) && (
                      <>
                        <Text style={[styles.sectionTitle, { marginTop: hasPendingChallenge ? spacing.xxl : 0 }]}>Setting Up</Text>
                        {lookingForPartner
                          .filter(p => invitedPlayerIds.has(p.id) || acceptedPlayerIds.has(p.id))
                          .map((player, index) => {
                            // For doubles: need 2 opponents total, calculate how many more needed
                            const acceptedCount = acceptedPlayerIds.size;
                            const playersNeeded = Math.max(0, 2 - acceptedCount);
                            return (
                              <JoinedPlayerCard
                                key={player.id}
                                player={player}
                                status={acceptedPlayerIds.has(player.id) ? 'accepted' : 'invited'}
                                onCancelInvite={handleCancelInvite}
                                index={index}
                                playersNeeded={playersNeeded}
                              />
                            );
                          })}
                      </>
                    )}

                    {/* Teams Ready */}
                    <Text style={[styles.sectionTitle, { marginTop: (hasPendingChallenge || (currentTeam && lookingForPartner.some(p => invitedPlayerIds.has(p.id) || acceptedPlayerIds.has(p.id)))) ? spacing.xxl : 0 }]}>
                      Teams ready
                    </Text>
                    {teams.map((team, index) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onChallenge={handleChallengeTeam}
                        isChallenged={challengedTeam?.id === team.id}
                        isAcceptedByMe={acceptedTeam?.id === team.id}
                        isCooldown={cooldownTeamId === team.id}
                        index={index}
                      />
                    ))}

                    {/* Solo Players */}
                    <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
                      Solo players
                    </Text>
                    {lookingForPartner
                      .filter(p => !acceptedPlayerIds.has(p.id) && !invitedPlayerIds.has(p.id))
                      .map((player, index) => (
                        <LookingForPartnerCard
                          key={player.id}
                          player={player}
                          onPlayerTap={handleSoloPlayerTap}
                          onCancelInvite={handleCancelInvite}
                          onRequestNextGame={handleRequestNextGame}
                          isInvited={false}
                          isNextGameRequested={nextGameRequestedIds.has(player.id)}
                          index={teams.length + index}
                        />
                      ))}
                  </>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <LogMatchSheet
        visible={showScoreFlow}
        onClose={() => setShowScoreFlow(false)}
        onComplete={handleScoreFlowComplete}
        teamALabel="You"
        teamBLabel="Them"
        matchSubtitle={effectiveUser && effectivePartner && opponentPlayers.length >= 2
          ? `${effectiveUser.name.split(' ')[0]} + ${effectivePartner.name.split(' ')[0]} vs ${opponentPlayers[0].name.split(' ')[0]} + ${opponentPlayers[1].name.split(' ')[0]}`
          : undefined}
      />

      {/* Dev Panel - only in __DEV__ mode */}
      {__DEV__ && showDevPanel && (
        <DevPanel
          sessionState={devSessionState}
          minutesSinceFormed={devMinutesSinceFormed}
          nudgeGlowEnabled={devNudgeGlowEnabled}
          onSessionStateChange={(state) => {
            setDevSessionState(state);
            if (state === 'NONE') {
              setShowLogPrompt(false);
            }
          }}
          onMinutesChange={setDevMinutesSinceFormed}
          onNudgeGlowToggle={() => setDevNudgeGlowEnabled(prev => !prev)}
          onClose={() => setShowDevPanel(false)}
        />
      )}

      {/* Profile Sidebar */}
      <ProfileSidebar
        visible={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        user={user}
        singlesRating={user?.elo}
        doublesRating={user?.elo ? Math.round(user.elo * 1.05) : undefined}
        onUpdateName={(name) => console.log('Update name:', name)}
        onUpdateAvatar={(uri) => console.log('Update avatar:', uri)}
        onMatchHistory={() => console.log('Match history')}
      />

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        activityBadgeCount={pendingConfirmationCount}
      />

      {/* Status Selector Modal - configuration only */}
      <StatusSelectorModal
        visible={showStatusSelector}
        isAvailable={isAvailable}
        autoMatchEnabled={autoMatchEnabled}
        playPreference={playPreference}
        onToggleAvailable={(available) => {
          setPresenceStatus(available ? 'available' : 'not_checked_in');
        }}
        onToggleAutoMatch={setAutoMatchEnabled}
        onChangePlayPreference={setPlayPreference}
        onSwitchToSingles={() => setGameMode('singles')}
        onSwitchToDoubles={() => setGameMode('doubles')}
        onClose={() => setShowStatusSelector(false)}
      />

      {/* Switch to Singles Confirmation Sheet */}
      <SwitchToSinglesSheet
        visible={showSwitchToSinglesSheet}
        partner={currentTeam?.partner ?? null}
        onConfirm={() => {
          setShowSwitchToSinglesSheet(false);
          if (currentTeam) {
            handleGameModeChange('singles');
          }
        }}
        onCancel={() => setShowSwitchToSinglesSheet(false)}
      />

      {/* Match Type Sheet - Doubles vs Singles selection */}
      <MatchTypeSheet
        visible={showMatchTypeSheet}
        player={matchTypeSheetPlayer}
        lastSelection={lastMatchTypeSelection}
        onSelectDoubles={handleSelectDoubles}
        onSelectSingles={handleSelectSingles}
        onClose={() => {
          setShowMatchTypeSheet(false);
          setMatchTypeSheetPlayer(null);
        }}
      />

      {/* Player Action Sheet - for solo player intent selection */}
      <PlayerActionSheet
        visible={actionSheetPlayer !== null}
        player={actionSheetPlayer}
        onClose={() => setActionSheetPlayer(null)}
        onPartnerUp={handleActionSheetPartnerUp}
        onPlaySingles={handleActionSheetPlaySingles}
      />

      {/* Team Preview Sheet - premium team overview */}
      <TeamPreviewSheet
        visible={showTeamPreview}
        user={user ? { ...user, status: 'Ready' as const } : null}
        partner={currentTeam?.partner ?? null}
        onClose={() => setShowTeamPreview(false)}
        onPlaySingles={() => {
          setShowTeamPreview(false);
          if (currentTeam) {
            handleGameModeChange('singles');
          }
        }}
        onLeaveTeam={() => {
          setShowTeamPreview(false);
          handleLeaveTeam();
        }}
        teamStats={{ wins: 3, losses: 1, streak: 2 }}
      />

      {/* Invite Bottom Sheet */}
      <InviteBottomSheet
        visible={showInviteSheet}
        onClose={() => setShowInviteSheet(false)}
        courtId="lincoln-park"
        courtName="Lincoln Park Courts"
        userId={user?.id ?? 'unknown'}
      />

      {/* Match Result Overlay - Premium result moment (legacy) */}
      {matchResult && (
        <MatchResultOverlay
          visible={showMatchResult}
          isWin={matchResult.isWin}
          previousElo={matchResult.previousElo}
          newElo={matchResult.newElo}
          opponents={matchResult.opponents}
          timestamp={matchResult.timestamp}
          onBackToCourt={handleMatchResultClose}
          onViewActivity={handleViewActivity}
        />
      )}

      {/* Match Submitted Modal - New match submission flow */}
      <MatchSubmittedModal
        visible={showMatchSubmitted}
        match={submittedMatch}
        onBackToCourt={handleMatchSubmittedClose}
        onViewActivity={handleMatchSubmittedViewActivity}
      />

      {/* Activity Screen - full screen overlay */}
      {activeTab === 'activity' && (
        <ActivityScreen
          onClose={() => setActiveTab('home')}
          onSwipeToHome={() => setActiveTab('home')}
          onSwipeToProfile={() => setActiveTab('profile')}
          scrollToMatchId={scrollToMatchId}
          onClearScrollTarget={() => setScrollToMatchId(null)}
        />
      )}

      {/* Profile Screen - full screen overlay */}
      {activeTab === 'profile' && (
        <ProfileScreen
          onClose={() => setActiveTab('home')}
          onSwipeToActivity={() => setActiveTab('activity')}
          user={user}
          singlesRating={user?.elo}
          doublesRating={user?.elo ? Math.round(user.elo * 1.05) : undefined}
          onUpdateName={(name) => console.log('Update name:', name)}
          onUpdateAvatar={(uri) => console.log('Update avatar:', uri)}
          onMatchHistory={() => {
            setActiveTab('activity');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  courtStatsCard: {
    backgroundColor: 'rgba(57, 255, 20, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  courtStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCount: {
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 26,
  },
  statCountPlaying: {
    color: colors.accent,
  },
  statCountReady: {
    color: '#FBBF24', // Amber/yellow for ready
  },
  statCountArriving: {
    color: '#60A5FA', // Blue for arriving
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pairCardContainer: {
    marginBottom: spacing.xl,
  },
  checkInContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardsContainer: {
    gap: spacing.md,
  },
  matchReadyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  switchModeButton: {
    alignSelf: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  switchModeText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  findNextButton: {
    alignSelf: 'center',
    backgroundColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.whiteBorder,
  },
  findNextText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  logPromptSheet: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recentMatchLogSheet: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  logPromptTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  logPromptBody: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  logPromptPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logPromptPrimaryText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  logPromptSecondary: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logPromptSecondaryText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  stickyActionBar: {
    position: 'absolute',
    bottom: 100, // Above the bottom nav bar with proper spacing
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: colors.accent,
  },
  actionButtonSecondary: {
    backgroundColor: colors.whiteMedium,
    borderWidth: 1,
    borderColor: colors.whiteBorder,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pulseDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.black,
    borderRadius: borderRadius.full,
  },
  actionButtonTextPrimary: {
    color: colors.black,
    fontWeight: '500',
    fontSize: 16,
  },
  actionButtonTextSecondary: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 16,
  },
  checkedInContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  statusPillArrow: {
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: 2,
  },
  checkedInLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
