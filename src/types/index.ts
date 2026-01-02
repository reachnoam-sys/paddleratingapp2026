export interface Player {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  status: 'Waiting' | 'On Court 2' | 'On Court 1' | 'Ready';
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
  status: 'Waiting' | 'On Court 1' | 'On Court 2' | 'Ready';
}

export type GameMode = 'singles' | 'doubles';

export interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
  elo: number;
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
