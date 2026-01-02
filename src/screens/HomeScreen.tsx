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
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Header,
  PlayerCard,
  TeamCard,
  GameModeToggle,
  LookingForPartnerCard,
  JoinedPlayerCard,
  MatchReadyCard,
  RecentMatchCard,
  LogMatchSheet,
  LogMatchDrawer,
  LogMatchGrabHandle,
  PendingChallengeCard,
  ProfileSidebar,
} from '../components';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useNearbyPlayers, useTeams, useCurrentUser } from '../hooks';
import { eloToRating } from '../utils';
import type { Player, Team, GameMode } from '../types';

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
  onSessionStateChange,
  onMinutesChange,
  onClose,
}: {
  sessionState: DevSessionState;
  minutesSinceFormed: number;
  onSessionStateChange: (state: DevSessionState) => void;
  onMinutesChange: (minutes: number) => void;
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
  const [gameMode, setGameMode] = useState<GameMode>('singles');
  const [invitedPlayerIds, setInvitedPlayerIds] = useState<Set<string>>(new Set());
  const [acceptedPlayerIds, setAcceptedPlayerIds] = useState<Set<string>>(new Set());
  const [challengedTeam, setChallengedTeam] = useState<Team | null>(null);
  const [acceptedTeam, setAcceptedTeam] = useState<Team | null>(null);
  const [challengedPlayer, setChallengedPlayer] = useState<Player | null>(null);
  const [acceptedPlayer, setAcceptedPlayer] = useState<Player | null>(null);
  const [singlesCooldownPlayerId, setSinglesCooldownPlayerId] = useState<string | null>(null);
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [showScoreFlow, setShowScoreFlow] = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [matchReadyTime, setMatchReadyTime] = useState<Date | null>(null);
  const [recentMatch, setRecentMatch] = useState<{ partner: Player; opponents: Player[] } | null>(null);
  const [isNewMatchAnimation, setIsNewMatchAnimation] = useState(true);
  const [cooldownTeamId, setCooldownTeamId] = useState<string | null>(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  // Dev mode state (only used in __DEV__)
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devSessionState, setDevSessionState] = useState<DevSessionState>('NONE');
  const [devMinutesSinceFormed, setDevMinutesSinceFormed] = useState(0);

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

  const handleChallenge = (player: Player) => {
    console.log('Challenge player:', player);
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

  const handleInvitePartner = async (player: Player) => {
    await invitePartner(player);
  };

  const handleChallengeToMatch = (player: Player) => {
    console.log('Invite to play:', player.name);
    setInvitedPlayerIds(prev => new Set(prev).add(player.id));
    // Simulate player accepting after 2 seconds (for demo purposes)
    setTimeout(() => {
      setInvitedPlayerIds(prev => {
        const next = new Set(prev);
        next.delete(player.id);
        return next;
      });
      setAcceptedPlayerIds(prev => new Set(prev).add(player.id));
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

  const handleOpenLogDrawer = () => {
    setShowLogDrawer(true);
  };

  const handleCloseLogDrawer = () => {
    setShowLogDrawer(false);
  };

  const handleDidntPlay = () => {
    setShowLogDrawer(false);
    handleCancelMatch();
  };

  const handleLogFromDrawer = () => {
    setShowLogDrawer(false);
    setShowScoreFlow(true);
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

  const handleScoreFlowComplete = () => {
    setShowScoreFlow(false);
    handleCancelMatch();
    setRecentMatch(null);
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

  const isLoading = gameMode === 'singles' ? playersLoading : teamsLoading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <Header
        userAvatar={currentUserDisplay.avatar}
        userElo={currentUserDisplay.elo}
        location="Lincoln Park Courts"
        partnerAvatar={isDevMode ? DEV_FIXTURE_PARTNER.avatar : currentTeam?.partner.avatar}
        teamElo={isDevMode ? eloToRating(DEV_FIXTURE_PARTNER.elo) : (currentTeam ? eloToRating(Math.round(currentTeam.combinedElo / 2)) : undefined)}
        onLeaveTeam={handleLeaveTeam}
        isMatchInProgress={!!isMatchReady}
        onCancelMatch={handleCancelMatch}
        onLongPressLocation={__DEV__ ? () => setShowDevPanel(true) : undefined}
        onProfilePress={() => setShowProfileSidebar(true)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hide mode toggle and counts when match is ready */}
        {!isMatchReady && (
          <>
            <View style={styles.toggleContainer}>
              <GameModeToggle mode={gameMode} onChange={handleGameModeChange} />
            </View>

            <View style={styles.countSection}>
              <Text style={styles.countLabel}>
                {gameMode === 'singles' ? 'Players at park' : 'Players & teams'}
              </Text>
              <Text style={styles.countValue}>
                {gameMode === 'singles'
                  ? players.length
                  : teams.length + lookingForPartner.length}
              </Text>
            </View>
          </>
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
                      onSaveScore={(teamAScore, teamBScore) => {
                        console.log('Score saved:', teamAScore, '-', teamBScore);
                        handleCancelMatch();
                      }}
                      isLastGame={isLastGame}
                      isNewMatch={isNewMatchAnimation}
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
                    onChallenge={handleChallenge}
                    isChallenged={challengedPlayer?.id === player.id}
                    isAcceptedByMe={acceptedPlayer?.id === player.id}
                    isCooldown={singlesCooldownPlayerId === player.id}
                    index={index}
                  />
                ))}
              </View>
            )}

            {gameMode === 'doubles' && (
              <View style={styles.cardsContainer}>
                {/* Match Ready - show ONLY this when match is ready */}
                {isMatchReady && effectiveUser && effectivePartner && (
                  <View style={styles.matchReadyContainer}>
                    <MatchReadyCard
                      teamA={[effectiveUser, effectivePartner]}
                      teamB={opponentPlayers}
                      onCancelMatch={handleCancelMatch}
                      onForfeit={handleCancelMatch}
                      onSubmitScore={handleLogScores}
                      onSaveScore={(teamAScore, teamBScore) => {
                        console.log('Score saved:', teamAScore, '-', teamBScore);
                        // TODO: Persist score to backend
                        handleCancelMatch();
                      }}
                      isLastGame={isLastGame}
                      isNewMatch={isNewMatchAnimation}
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
                    {/* Your Challenge Section - show when team accepted but user needs partner */}
                    {hasPendingChallenge && acceptedTeam && (
                      <>
                        <Text style={styles.sectionTitle}>Your Challenge</Text>
                        <PendingChallengeCard
                          acceptedTeam={acceptedTeam}
                          onCancelChallenge={handleCancelMatch}
                        />
                      </>
                    )}

                    {/* Game Forming Section */}
                    {currentTeam && lookingForPartner.some(p => invitedPlayerIds.has(p.id) || acceptedPlayerIds.has(p.id)) && (
                      <>
                        <Text style={[styles.sectionTitle, { marginTop: hasPendingChallenge ? spacing.xxl : 0 }]}>Game Forming</Text>
                        {lookingForPartner
                          .filter(p => invitedPlayerIds.has(p.id) || acceptedPlayerIds.has(p.id))
                          .map((player, index) => (
                            <JoinedPlayerCard
                              key={player.id}
                              player={player}
                              status={acceptedPlayerIds.has(player.id) ? 'accepted' : 'invited'}
                              onCancelInvite={handleCancelInvite}
                              index={index}
                            />
                          ))}
                      </>
                    )}

                    {/* Formed Teams */}
                    <Text style={[styles.sectionTitle, { marginTop: (hasPendingChallenge || (currentTeam && lookingForPartner.some(p => invitedPlayerIds.has(p.id) || acceptedPlayerIds.has(p.id)))) ? spacing.xxl : 0 }]}>
                      Formed Teams
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

                    {/* Looking for Partner */}
                    <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
                      Looking for Partner
                    </Text>
                    {lookingForPartner
                      .filter(p => !acceptedPlayerIds.has(p.id) && !invitedPlayerIds.has(p.id))
                      .map((player, index) => (
                        <LookingForPartnerCard
                          key={player.id}
                          player={player}
                          onInvite={handleInvitePartner}
                          onChallengeToMatch={handleChallengeToMatch}
                          onCancelInvite={handleCancelInvite}
                          hasTeam={!!currentTeam}
                          isInvited={false}
                          index={teams.length + index}
                        />
                      ))}
                  </>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Hide action bar when match is ready */}
      {!isMatchReady && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={styles.stickyActionBar}
        >
          <AnimatedPressable
            style={[
              styles.actionButton,
              gameMode === 'singles'
                ? styles.actionButtonSecondary
                : styles.actionButtonPrimary,
              animatedButtonStyle,
            ]}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
          >
            {gameMode === 'singles' ? (
              <Text style={styles.actionButtonTextSecondary}>Check in</Text>
            ) : (
              <View style={styles.actionButtonContent}>
                <Animated.View style={[styles.pulseDot, animatedPulseStyle]} />
                <Text style={styles.actionButtonTextPrimary}>
                  {currentTeam
                    ? `Find ${2 - acceptedPlayerIds.size} more player${2 - acceptedPlayerIds.size !== 1 ? 's' : ''}`
                    : 'Quick Match'}
                </Text>
              </View>
            )}
          </AnimatedPressable>
        </Animated.View>
      )}

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

      {/* Log Match Drawer - swipe-up bottom sheet */}
      <LogMatchDrawer
        visible={showLogDrawer}
        onLogScore={handleLogFromDrawer}
        onDidntPlay={handleDidntPlay}
        onClose={handleCloseLogDrawer}
      />

      {/* Dev Panel - only in __DEV__ mode */}
      {__DEV__ && showDevPanel && (
        <DevPanel
          sessionState={devSessionState}
          minutesSinceFormed={devMinutesSinceFormed}
          onSessionStateChange={(state) => {
            setDevSessionState(state);
            if (state === 'NONE') {
              setShowLogPrompt(false);
            }
          }}
          onMinutesChange={setDevMinutesSinceFormed}
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
  toggleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  countSection: {
    marginBottom: spacing.xxl,
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  countValue: {
    color: colors.white,
    fontWeight: '500',
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.8,
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
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: 34,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
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
});
