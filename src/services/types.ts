// Service layer types for API integration

/**
 * Standard API error shape for consistent error handling
 */
export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Async operation state for tracking loading/error/success
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * API response wrapper for consistent response handling
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Pagination params for list endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Common error codes for consistent handling
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Create a standardized API error
 */
export function createApiError(
  code: ErrorCode,
  message: string,
  statusCode?: number,
  details?: Record<string, unknown>
): ApiError {
  return { code, message, statusCode, details };
}

/**
 * Initial async state helper
 */
export function initialAsyncState<T>(initialData: T | null = null): AsyncState<T> {
  return {
    data: initialData,
    loading: false,
    error: null,
  };
}

/**
 * Set loading state
 */
export function setLoading<T>(state: AsyncState<T>): AsyncState<T> {
  return { ...state, loading: true, error: null };
}

/**
 * Set success state with data
 */
export function setSuccess<T>(state: AsyncState<T>, data: T): AsyncState<T> {
  return { data, loading: false, error: null };
}

/**
 * Set error state
 */
export function setError<T>(state: AsyncState<T>, error: ApiError): AsyncState<T> {
  return { ...state, loading: false, error };
}

// ============================================
// Service Interfaces
// ============================================
// These interfaces define the contract for each service.
// Swap implementations (mock → real API) without changing consumers.

import type { Player, Team, CurrentUser } from '../types';

/**
 * Player service interface
 * Handles player data and actions
 */
export interface IPlayerService {
  /** Get the currently authenticated user */
  getCurrentUser(): Promise<CurrentUser>;
  /** Get nearby players for matchmaking */
  getNearbyPlayers(): Promise<Player[]>;
  /** Get a single player by ID */
  getPlayerById(id: string): Promise<Player | null>;
  /** Send a challenge to a player */
  challengePlayer(playerId: string, message?: string): Promise<{ success: boolean }>;
  /** Update current user's status */
  updateStatus(status: Player['status']): Promise<{ success: boolean }>;
}

/**
 * Team service interface
 * Handles team formation and challenges
 */
export interface ITeamService {
  /** Get formed teams available for challenge */
  getTeams(): Promise<Team[]>;
  /** Get solo players looking for a partner */
  getLookingForPartner(): Promise<Player[]>;
  /** Invite a player to form a team */
  invitePartner(playerId: string): Promise<{ success: boolean; teamId: string }>;
  /** Leave current team */
  leaveTeam(teamId: string): Promise<{ success: boolean }>;
  /** Challenge another team */
  challengeTeam(teamId: string): Promise<{ success: boolean }>;
}

/**
 * Location service interface
 * Handles court/venue operations
 */
export interface ILocationService {
  /** Get current location/court info */
  getCurrentLocation(): Promise<{ name: string; id: string }>;
  /** Check in at a location */
  checkIn(locationId: string): Promise<{ success: boolean }>;
}

/**
 * Match service interface
 * Handles match creation and confirmation
 */
export interface IMatchService {
  /** Create a new match record */
  createMatch(params: {
    courtId: string;
    mode: 'singles' | 'doubles';
    teamAIds: string[];
    teamBIds: string[];
    games: { teamAScore: number; teamBScore: number }[];
  }): Promise<{ success: boolean; matchId: string }>;
  /** Confirm a match result */
  confirmMatch(matchId: string): Promise<{ success: boolean }>;
  /** Dispute a match result */
  disputeMatch(matchId: string, reason: string): Promise<{ success: boolean }>;
  /** Get match by ID */
  getMatch(matchId: string): Promise<unknown>;
  /** Get user's match history */
  getMatchHistory(userId: string, pagination?: PaginationParams): Promise<PaginatedResponse<unknown>>;
}

/**
 * Session service interface (real-time doubles sessions)
 * Handles team swapping and session state sync
 */
export interface ISessionService {
  /** Create a new doubles session */
  createSession(params: {
    courtId: string;
    playerIds: string[];
  }): Promise<{ success: boolean; sessionId: string }>;
  /** Update team arrangement */
  updateArrangement(sessionId: string, teamA: [string, string], teamB: [string, string]): Promise<{ success: boolean }>;
  /** Record a game result */
  recordGame(sessionId: string, teamAScore: number, teamBScore: number): Promise<{ success: boolean }>;
  /** End session */
  endSession(sessionId: string): Promise<{ success: boolean }>;
  /** Subscribe to session updates (for real-time sync) */
  subscribeToSession?(sessionId: string, callback: (update: unknown) => void): () => void;
}
