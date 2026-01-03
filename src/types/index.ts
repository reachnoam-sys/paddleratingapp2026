// User-controlled status (only one active state)
export type UserStatus = 'Available' | 'Checked Out';

// System-derived display states (computed from context)
export type DerivedStatus = 'Available' | 'On Court' | 'In Queue' | 'Matching';

// Play preference for auto-matching
export type PlayPreference = 'Singles' | 'Doubles' | 'Either';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  // Legacy status for backward compatibility - will be computed
  status: 'Waiting' | 'On Court 2' | 'On Court 1' | 'Ready' | 'Available';
  // New fields for system-derived state
  isOnCourt?: boolean;
  isInQueue?: boolean;
  isMatching?: boolean;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}

export interface TeamPlayer {
  name: string;
  avatar: string;
  elo?: number;
}

export interface Team {
  id: string;
  name: string;
  player1: TeamPlayer;
  player2: TeamPlayer;
  combinedElo: number;
  status: 'Waiting' | 'On Court 1' | 'On Court 2' | 'Ready' | 'Available';
  isOnCourt?: boolean;
  isInQueue?: boolean;
}

export type GameMode = 'singles' | 'doubles';

export interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  // User preferences
  autoMatchEnabled?: boolean;
  playPreference?: PlayPreference;
}

export interface CurrentTeam {
  id: string;
  partner: Player;
  combinedElo: number;
}

// Session-based scoring types
export interface SessionGame {
  id: string;
  teamAScore: number;
  teamBScore: number;
  timestamp: Date;
}

export interface PlaySession {
  id: string;
  location: string;
  startTime: Date;
  endTime?: Date;
  teamA: Player[];
  teamB: Player[];
  games: SessionGame[];
  status: 'active' | 'completed';
}

// Court/Location types for deep linking
export interface Court {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  courtCount?: number;
  surfaceType?: 'indoor' | 'outdoor' | 'mixed';
  amenities?: string[];
  imageUrl?: string;
}

// Deep link invite data
export interface CourtInvite {
  courtId: string;
  referrerId?: string; // User who shared the link
  timestamp?: number;
}
