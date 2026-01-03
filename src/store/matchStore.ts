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
  };
}
