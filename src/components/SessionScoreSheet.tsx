import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  FadeInDown,
} from 'react-native-reanimated';
import { X, Plus, ChevronRight, Trophy, Clock } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import type { PlaySession } from '../types';

interface SessionScoreSheetProps {
  visible: boolean;
  session: PlaySession | null;
  onClose: () => void;
  onAddGame: (teamAScore: number, teamBScore: number) => void;
  onEndSession: () => void;
}

function formatDuration(start: Date, end?: Date): string {
  const endTime = end || new Date();
  const diffMs = endTime.getTime() - start.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function SessionScoreSheet({
  visible,
  session,
  onClose,
  onAddGame,
  onEndSession,
}: SessionScoreSheetProps) {
  const [showAddGame, setShowAddGame] = useState(false);
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');

  if (!visible || !session) return null;

  const teamAWins = session.games.filter(g => g.teamAScore > g.teamBScore).length;
  const teamBWins = session.games.filter(g => g.teamBScore > g.teamAScore).length;

  const handleAddGame = () => {
    const scoreA = parseInt(teamAScore, 10);
    const scoreB = parseInt(teamBScore, 10);
    if (!isNaN(scoreA) && !isNaN(scoreB)) {
      onAddGame(scoreA, scoreB);
      setTeamAScore('');
      setTeamBScore('');
      setShowAddGame(false);
    }
  };

  const teamANames = session.teamA.map(p => p.name.split(' ')[0]).join(' & ');
  const teamBNames = session.teamB.map(p => p.name.split(' ')[0]).join(' & ');

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayPressable} onPress={onClose} />

        <Animated.View
          entering={SlideInUp.duration(400).springify().damping(18)}
          exiting={SlideOutDown.duration(300)}
          style={styles.sheet}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Session</Text>
              <View style={styles.durationBadge}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={styles.durationText}>
                  {formatDuration(session.startTime, session.endTime)}
                </Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Location */}
          <Text style={styles.location}>{session.location}</Text>

          {/* Teams Display */}
          <View style={styles.teamsContainer}>
            <View style={styles.teamColumn}>
              <View style={styles.teamAvatars}>
                {session.teamA.map((player, idx) => (
                  <Image
                    key={player.id}
                    source={{ uri: player.avatar }}
                    style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
                  />
                ))}
              </View>
              <Text style={styles.teamNames}>{teamANames}</Text>
              <Text style={styles.winsCount}>{teamAWins}</Text>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>vs</Text>
            </View>

            <View style={styles.teamColumn}>
              <View style={styles.teamAvatars}>
                {session.teamB.map((player, idx) => (
                  <Image
                    key={player.id}
                    source={{ uri: player.avatar }}
                    style={[styles.avatar, idx > 0 && styles.avatarOverlap]}
                  />
                ))}
              </View>
              <Text style={styles.teamNames}>{teamBNames}</Text>
              <Text style={styles.winsCount}>{teamBWins}</Text>
            </View>
          </View>

          {/* Games List */}
          <ScrollView style={styles.gamesList} showsVerticalScrollIndicator={false}>
            {session.games.length === 0 ? (
              <View style={styles.emptyGames}>
                <Text style={styles.emptyGamesText}>No games logged yet</Text>
                <Text style={styles.emptyGamesSubtext}>
                  Add scores when you finish each game
                </Text>
              </View>
            ) : (
              session.games.map((game, index) => (
                <Animated.View
                  key={game.id}
                  entering={FadeInDown.delay(index * 50).duration(200)}
                  style={styles.gameRow}
                >
                  <View style={styles.gameNumber}>
                    <Text style={styles.gameNumberText}>G{index + 1}</Text>
                  </View>
                  <View style={styles.gameScores}>
                    <Text style={[
                      styles.gameScore,
                      game.teamAScore > game.teamBScore && styles.winningScore
                    ]}>
                      {game.teamAScore}
                    </Text>
                    <Text style={styles.scoreDash}>-</Text>
                    <Text style={[
                      styles.gameScore,
                      game.teamBScore > game.teamAScore && styles.winningScore
                    ]}>
                      {game.teamBScore}
                    </Text>
                  </View>
                  <Text style={styles.gameTime}>{formatTime(game.timestamp)}</Text>
                </Animated.View>
              ))
            )}

            {/* Add Game Button/Form */}
            {showAddGame ? (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={styles.addGameForm}
              >
                <View style={styles.scoreInputs}>
                  <View style={styles.scoreInputWrapper}>
                    <Text style={styles.scoreInputLabel}>{teamANames}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      value={teamAScore}
                      onChangeText={setTeamAScore}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.inputDash}>-</Text>
                  <View style={styles.scoreInputWrapper}>
                    <Text style={styles.scoreInputLabel}>{teamBNames}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      value={teamBScore}
                      onChangeText={setTeamBScore}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      maxLength={2}
                    />
                  </View>
                </View>
                <View style={styles.addGameActions}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowAddGame(false);
                      setTeamAScore('');
                      setTeamBScore('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.saveButton,
                      (!teamAScore || !teamBScore) && styles.saveButtonDisabled
                    ]}
                    onPress={handleAddGame}
                    disabled={!teamAScore || !teamBScore}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <Pressable
                style={styles.addGameButton}
                onPress={() => setShowAddGame(true)}
              >
                <Plus size={18} color={colors.accent} />
                <Text style={styles.addGameButtonText}>Log game score</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {session.status === 'active' && (
              <Pressable style={styles.endSessionButton} onPress={onEndSession}>
                <Trophy size={18} color={colors.black} />
                <Text style={styles.endSessionText}>End session</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Compact session card for the home screen
interface SessionCardProps {
  session: PlaySession;
  onPress: () => void;
}

export function ActiveSessionCard({ session, onPress }: SessionCardProps) {
  const teamAWins = session.games.filter(g => g.teamAScore > g.teamBScore).length;
  const teamBWins = session.games.filter(g => g.teamBScore > g.teamAScore).length;
  const teamANames = session.teamA.map(p => p.name.split(' ')[0]).join(' & ');
  const teamBNames = session.teamB.map(p => p.name.split(' ')[0]).join(' & ');

  return (
    <Pressable style={styles.sessionCard} onPress={onPress}>
      <View style={styles.sessionCardHeader}>
        <View style={styles.sessionCardLive}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Active session</Text>
        </View>
        <Text style={styles.sessionCardDuration}>
          {formatDuration(session.startTime)}
        </Text>
      </View>

      <View style={styles.sessionCardTeams}>
        <Text style={styles.sessionCardTeamName}>{teamANames}</Text>
        <View style={styles.sessionCardScore}>
          <Text style={styles.sessionCardScoreText}>{teamAWins}</Text>
          <Text style={styles.sessionCardScoreDash}>-</Text>
          <Text style={styles.sessionCardScoreText}>{teamBWins}</Text>
        </View>
        <Text style={styles.sessionCardTeamName}>{teamBNames}</Text>
      </View>

      <View style={styles.sessionCardFooter}>
        <Text style={styles.sessionCardGames}>
          {session.games.length} game{session.games.length !== 1 ? 's' : ''} played
        </Text>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.blackOverlay,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.whiteSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  durationText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: spacing.xs,
  },
  location: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  teamColumn: {
    alignItems: 'center',
    flex: 1,
  },
  teamAvatars: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  teamNames: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  winsCount: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '600',
  },
  vsContainer: {
    paddingHorizontal: spacing.lg,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  gamesList: {
    paddingHorizontal: spacing.lg,
    maxHeight: 300,
  },
  emptyGames: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyGamesText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  emptyGamesSubtext: {
    color: colors.textMuted,
    fontSize: 14,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteSubtle,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  gameNumber: {
    backgroundColor: colors.whiteMedium,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  gameNumberText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  gameScores: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  gameScore: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'center',
  },
  winningScore: {
    color: colors.accent,
  },
  scoreDash: {
    color: colors.textMuted,
    fontSize: 16,
  },
  gameTime: {
    color: colors.textMuted,
    fontSize: 12,
  },
  addGameForm: {
    backgroundColor: colors.whiteSubtle,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreInputWrapper: {
    alignItems: 'center',
  },
  scoreInputLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  scoreInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.lg,
    width: 64,
    height: 56,
    textAlign: 'center',
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
  inputDash: {
    color: colors.textMuted,
    fontSize: 24,
    marginTop: spacing.xl,
  },
  addGameActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.whiteMedium,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '600',
  },
  addGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.whiteSubtle,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  addGameButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  endSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  endSessionText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  // Session Card Styles
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sessionCardLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
  },
  liveText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionCardDuration: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sessionCardTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  sessionCardTeamName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  sessionCardScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionCardScoreText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
  sessionCardScoreDash: {
    color: colors.textMuted,
    fontSize: 16,
  },
  sessionCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sessionCardGames: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
