// Session Store - Manages doubles sessions with team swapping
import { useState, useEffect } from 'react';
import { Player, DoublesSession, TeamComboRecord, SessionGameRecord, createTeamComboId } from '../types';

type Listener = () => void;

class SessionStore {
  private currentSession: DoublesSession | null = null;
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  getCurrentSession(): DoublesSession | null {
    return this.currentSession;
  }

  // Start a new doubles session with 4 players
  startSession(params: {
    courtId: string;
    courtName: string;
    players: Player[];
  }): DoublesSession {
    if (params.players.length !== 4) {
      throw new Error('Doubles session requires exactly 4 players');
    }

    const playerIds = params.players.map(p => p.id);

    // Initialize all 6 possible team combinations for tracking
    const comboRecords = this.initializeComboRecords(playerIds);

    const session: DoublesSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      courtId: params.courtId,
      courtName: params.courtName,
      startedAt: Date.now(),
      players: params.players,
      // Default arrangement: first 2 vs last 2
      teamA: [playerIds[0], playerIds[1]],
      teamB: [playerIds[2], playerIds[3]],
      phase: 'ready', // Start in ready - user sees Match Ready first, Swap triggers arranging
      games: [],
      comboRecords,
    };

    this.currentSession = session;
    this.notify();
    return session;
  }

  // Initialize all 6 possible team combos (C(4,2) = 6)
  private initializeComboRecords(playerIds: string[]): TeamComboRecord[] {
    const combos: TeamComboRecord[] = [];
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        combos.push({
          id: createTeamComboId(playerIds[i], playerIds[j]),
          player1Id: playerIds[i],
          player2Id: playerIds[j],
          wins: 0,
          losses: 0,
        });
      }
    }
    return combos;
  }

  // Update team arrangement (swap players between teams)
  updateArrangement(teamA: [string, string], teamB: [string, string]): void {
    if (!this.currentSession) return;
    if (this.currentSession.phase !== 'arranging') return;

    this.currentSession.teamA = teamA;
    this.currentSession.teamB = teamB;
    this.notify();
  }

  // Lock teams and transition to ready phase
  lockTeams(): void {
    if (!this.currentSession) return;
    if (this.currentSession.phase !== 'arranging') return;

    this.currentSession.phase = 'ready';
    this.notify();
  }

  // Unlock teams (go back to arranging)
  unlockTeams(): void {
    if (!this.currentSession) return;
    if (this.currentSession.phase !== 'ready') return;

    this.currentSession.phase = 'arranging';
    this.notify();
  }

  // Record a game result and update combo records
  recordGame(teamAScore: number, teamBScore: number): void {
    if (!this.currentSession) return;

    const game: SessionGameRecord = {
      id: `game-${Date.now()}`,
      teamAPlayerIds: this.currentSession.teamA,
      teamBPlayerIds: this.currentSession.teamB,
      teamAScore,
      teamBScore,
      playedAt: Date.now(),
    };

    this.currentSession.games.push(game);

    // Update combo records for both teams
    const teamAWon = teamAScore > teamBScore;
    const teamAComboId = createTeamComboId(...this.currentSession.teamA);
    const teamBComboId = createTeamComboId(...this.currentSession.teamB);

    this.currentSession.comboRecords = this.currentSession.comboRecords.map(record => {
      if (record.id === teamAComboId) {
        return {
          ...record,
          wins: record.wins + (teamAWon ? 1 : 0),
          losses: record.losses + (teamAWon ? 0 : 1),
        };
      }
      if (record.id === teamBComboId) {
        return {
          ...record,
          wins: record.wins + (teamAWon ? 0 : 1),
          losses: record.losses + (teamAWon ? 1 : 0),
        };
      }
      return record;
    });

    // Go back to arranging phase for next game
    this.currentSession.phase = 'arranging';
    this.notify();
  }

  // Get combo record for current team arrangement
  getCurrentComboRecords(): { teamA: TeamComboRecord | undefined; teamB: TeamComboRecord | undefined } {
    if (!this.currentSession) return { teamA: undefined, teamB: undefined };

    const teamAComboId = createTeamComboId(...this.currentSession.teamA);
    const teamBComboId = createTeamComboId(...this.currentSession.teamB);

    return {
      teamA: this.currentSession.comboRecords.find(r => r.id === teamAComboId),
      teamB: this.currentSession.comboRecords.find(r => r.id === teamBComboId),
    };
  }

  // End the session
  endSession(): DoublesSession | null {
    const session = this.currentSession;
    if (session) {
      session.phase = 'completed';
    }
    this.currentSession = null;
    this.notify();
    return session;
  }

  // Clear session (for testing/cleanup)
  clearSession(): void {
    this.currentSession = null;
    this.notify();
  }
}

// Singleton instance
export const sessionStore = new SessionStore();

// React hook for session store
export function useSessionStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = sessionStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  return {
    session: sessionStore.getCurrentSession(),
    startSession: sessionStore.startSession.bind(sessionStore),
    updateArrangement: sessionStore.updateArrangement.bind(sessionStore),
    lockTeams: sessionStore.lockTeams.bind(sessionStore),
    unlockTeams: sessionStore.unlockTeams.bind(sessionStore),
    recordGame: sessionStore.recordGame.bind(sessionStore),
    getCurrentComboRecords: sessionStore.getCurrentComboRecords.bind(sessionStore),
    endSession: sessionStore.endSession.bind(sessionStore),
    clearSession: sessionStore.clearSession.bind(sessionStore),
  };
}
