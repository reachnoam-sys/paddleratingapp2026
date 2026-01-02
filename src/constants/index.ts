// App-wide constants

export const APP_NAME = 'Paddle Rating';

// Rating system
export const RATING = {
  MIN_ELO: 1000,
  MAX_ELO: 2000,
  MIN_DUPR: 2.0,
  MAX_DUPR: 6.0,
  DEFAULT_ELO: 1200,
} as const;

// Animation durations (ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PULSE: 1000,
} as const;

// API endpoints (for future use)
export const API = {
  BASE_URL: '', // Will be set from env
  TIMEOUT: 10000,
} as const;

// Player status options
export const PLAYER_STATUS = {
  WAITING: 'Waiting',
  READY: 'Ready',
  ON_COURT_1: 'On Court 1',
  ON_COURT_2: 'On Court 2',
} as const;

// Game modes
export const GAME_MODE = {
  SINGLES: 'singles',
  DOUBLES: 'doubles',
} as const;

// Screen names for navigation
export const SCREENS = {
  HOME: 'Home',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  MATCH_HISTORY: 'MatchHistory',
  CHALLENGE: 'Challenge',
  FIND_PARTNER: 'FindPartner',
} as const;
