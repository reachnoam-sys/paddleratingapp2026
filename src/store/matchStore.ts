// Match Store - Local state management for matches
// TODO: Replace with backend API calls when ready

import { Player } from '../types';

export type MatchStatus = 'pending' | 'confirmed' | 'disputed' | 'expired';

export type ConfirmationState = 'approved' | 'declined' | 'pending';

export interface MatchParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  ratingBefore?: number;
  ratingAfter?: number;
}

export interface MatchConfirmation {
  odinal: string;
  state: ConfirmationState;
}

export interface MatchGame {
  teamAScore: number;
  teamBScore: number;
}

export interface Match {
  id: string;
  createdAt: number; // ms timestamp
  courtId: string;
  courtName: string;
  mode: 'singles' | 'doubles';
  // Team A = current user's team, Team B = opponents
  teamA: MatchParticipant[];
  teamB: MatchParticipant[];
  games: MatchGame[];
  // Win-loss record: teamA wins - teamB wins
  teamAWins: number;
  teamBWins: number;
  status: MatchStatus;
  expiresAt: number; // createdAt + 24h
  confirmations: MatchConfirmation[];
  // Rating changes (optional - calculated after confirmation)
  ratingDelta?: number;
}

// Simple in-memory store with listeners
type Listener = () => void;

class MatchStore {
  private matches: Match[] = [];
  private listeners: Set<Listener> = new Set();
  private currentUserId: string = 'current-user'; // TODO: Get from auth

  // Subscribe to changes
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Get all matches
  getMatches(): Match[] {
    return [...this.matches];
  }

  // Get matches by status
  getMatchesByStatus(status: MatchStatus): Match[] {
    return this.matches.filter(m => m.status === status);
  }

  // Get pending matches that need user confirmation
  getPendingConfirmations(): Match[] {
    return this.matches.filter(m => {
      if (m.status !== 'pending') return false;
      const userConfirmation = m.confirmations.find(c => c.odinal === this.currentUserId);
      return userConfirmation?.state === 'pending';
    });
  }

  // Get pending confirmation count (for badge)
  getPendingConfirmationCount(): number {
    return this.getPendingConfirmations().length;
  }

  // Create a new match after score submission
  createMatch(params: {
    courtId: string;
    courtName: string;
    mode: 'singles' | 'doubles';
    teamA: MatchParticipant[];
    teamB: MatchParticipant[];
    games: MatchGame[];
    currentUserId: string;
  }): Match {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // Calculate win-loss record
    const teamAWins = params.games.filter(g => g.teamAScore > g.teamBScore).length;
    const teamBWins = params.games.filter(g => g.teamBScore > g.teamAScore).length;

    // Create confirmations - submitter auto-approves, opponents pending
    const confirmations: MatchConfirmation[] = [
      { odinal: params.currentUserId, state: 'approved' },
      ...params.teamB.map(p => ({ odinal: p.id, state: 'pending' as ConfirmationState })),
    ];

    const match: Match = {
      id: `match-${now}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      courtId: params.courtId,
      courtName: params.courtName,
      mode: params.mode,
      teamA: params.teamA,
      teamB: params.teamB,
      games: params.games,
      teamAWins,
      teamBWins,
      status: 'pending',
      expiresAt: now + TWENTY_FOUR_HOURS,
      confirmations,
    };

    this.matches.unshift(match); // Add to beginning
    this.notify();
    return match;
  }

  // Confirm a match
  confirmMatch(matchId: string, userId: string): void {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    const confirmation = match.confirmations.find(c => c.odinal === userId);
    if (confirmation) {
      confirmation.state = 'approved';
    }

    // Check if all confirmations are approved
    const allApproved = match.confirmations.every(c => c.state === 'approved');
    if (allApproved) {
      match.status = 'confirmed';
    }

    this.notify();
  }

  // Dispute a match
  disputeMatch(matchId: string, _reason?: string): void {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    match.status = 'disputed';
    // TODO: Store dispute reason, notify admin, etc.
    this.notify();
  }

  // Check for expired matches
  checkExpiredMatches(): void {
    const now = Date.now();
    let hasChanges = false;

    this.matches.forEach(match => {
      if (match.status === 'pending' && now > match.expiresAt) {
        match.status = 'expired';
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.notify();
    }
  }

  // Get a single match by ID
  getMatch(matchId: string): Match | undefined {
    return this.matches.find(m => m.id === matchId);
  }

  // Set current user ID (call from auth)
  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
  }

  // Get current user ID
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  // Clear all matches (for testing/logout)
  clearMatches(): void {
    this.matches = [];
    this.notify();
  }

  // Seed mock matches for testing
  seedMockMatches(): void {
    if (this.matches.length > 0) return; // Don't seed if already have matches

    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // Mock match 1 - Pending confirmation (2-1 win, 3 games)
    const pendingMatch: Match = {
      id: 'mock-match-pending-1',
      createdAt: now - 5 * 60 * 1000, // 5 mins ago
      courtId: 'lincoln-park',
      courtName: 'Lincoln Park',
      mode: 'doubles',
      teamA: [
        { id: 'current-user', name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=you', ratingBefore: 1420 },
        { id: 'partner-1', name: 'David Chen', avatarUrl: 'https://i.pravatar.cc/150?u=david', ratingBefore: 1380 },
      ],
      teamB: [
        { id: 'opp-1', name: 'Sarah Kim', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', ratingBefore: 1350 },
        { id: 'opp-2', name: 'Marcus Lee', avatarUrl: 'https://i.pravatar.cc/150?u=marcus', ratingBefore: 1320 },
      ],
      games: [
        { teamAScore: 11, teamBScore: 7 },
        { teamAScore: 9, teamBScore: 11 },
        { teamAScore: 11, teamBScore: 5 },
      ],
      teamAWins: 2,
      teamBWins: 1,
      status: 'pending',
      expiresAt: now + TWENTY_FOUR_HOURS,
      confirmations: [
        { odinal: 'current-user', state: 'pending' },
        { odinal: 'partner-1', state: 'approved' },
        { odinal: 'opp-1', state: 'approved' },
        { odinal: 'opp-2', state: 'approved' },
      ],
    };

    // Mock match 2 - Confirmed (2-0 win yesterday)
    const confirmedMatch1: Match = {
      id: 'mock-match-confirmed-1',
      createdAt: now - 24 * 60 * 60 * 1000, // Yesterday
      courtId: 'lincoln-park',
      courtName: 'Lincoln Park',
      mode: 'doubles',
      teamA: [
        { id: 'current-user', name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=you', ratingBefore: 1400, ratingAfter: 1420 },
        { id: 'partner-2', name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/150?u=alex', ratingBefore: 1360 },
      ],
      teamB: [
        { id: 'opp-3', name: 'Jordan Park', avatarUrl: 'https://i.pravatar.cc/150?u=jordan', ratingBefore: 1400 },
        { id: 'opp-4', name: 'Emma Wilson', avatarUrl: 'https://i.pravatar.cc/150?u=emma', ratingBefore: 1380 },
      ],
      games: [
        { teamAScore: 11, teamBScore: 9 },
        { teamAScore: 11, teamBScore: 8 },
      ],
      teamAWins: 2,
      teamBWins: 0,
      status: 'confirmed',
      expiresAt: now,
      confirmations: [
        { odinal: 'current-user', state: 'approved' },
        { odinal: 'partner-2', state: 'approved' },
        { odinal: 'opp-3', state: 'approved' },
        { odinal: 'opp-4', state: 'approved' },
      ],
      ratingDelta: 20,
    };

    // Mock match 3 - Confirmed (1-2 loss, 2 days ago)
    const confirmedMatch2: Match = {
      id: 'mock-match-confirmed-2',
      createdAt: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      courtId: 'riverside-courts',
      courtName: 'Riverside Courts',
      mode: 'singles',
      teamA: [
        { id: 'current-user', name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=you', ratingBefore: 1420, ratingAfter: 1400 },
      ],
      teamB: [
        { id: 'opp-5', name: 'Chris Taylor', avatarUrl: 'https://i.pravatar.cc/150?u=chris', ratingBefore: 1480 },
      ],
      games: [
        { teamAScore: 11, teamBScore: 9 },
        { teamAScore: 7, teamBScore: 11 },
        { teamAScore: 5, teamBScore: 11 },
      ],
      teamAWins: 1,
      teamBWins: 2,
      status: 'confirmed',
      expiresAt: now,
      confirmations: [
        { odinal: 'current-user', state: 'approved' },
        { odinal: 'opp-5', state: 'approved' },
      ],
      ratingDelta: -20,
    };

    this.matches = [pendingMatch, confirmedMatch1, confirmedMatch2];
    this.notify();
  }
}

// Singleton instance
export const matchStore = new MatchStore();

// Helper to convert Players to MatchParticipants
export function playersToParticipants(players: Player[], ratings?: { before?: number; after?: number }[]): MatchParticipant[] {
  return players.map((p, i) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatar,
    ratingBefore: ratings?.[i]?.before ?? p.elo,
    ratingAfter: ratings?.[i]?.after,
  }));
}

// Helper hook for React components
import { useState, useEffect } from 'react';

export function useMatchStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = matchStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  return {
    matches: matchStore.getMatches(),
    pendingMatches: matchStore.getMatchesByStatus('pending'),
    confirmedMatches: matchStore.getMatchesByStatus('confirmed'),
    disputedMatches: matchStore.getMatchesByStatus('disputed'),
    expiredMatches: matchStore.getMatchesByStatus('expired'),
    pendingConfirmationCount: matchStore.getPendingConfirmationCount(),
    createMatch: matchStore.createMatch.bind(matchStore),
    confirmMatch: matchStore.confirmMatch.bind(matchStore),
    disputeMatch: matchStore.disputeMatch.bind(matchStore),
    checkExpiredMatches: matchStore.checkExpiredMatches.bind(matchStore),
    seedMockMatches: matchStore.seedMockMatches.bind(matchStore),
  };
}
