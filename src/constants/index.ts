// App-wide constants

export const APP_NAME = 'Paddle Rating';

// Feature flags - flip these for backend integration
export const FEATURES = {
  /** Use mock data instead of real API calls */
  USE_MOCK_API: true,
  /** Enable offline persistence with AsyncStorage */
  ENABLE_OFFLINE: false,
  /** Enable real-time sync (WebSocket/Supabase) */
  ENABLE_REALTIME: false,
  /** Show dev panel on long-press (auto-disabled in production) */
  SHOW_DEV_TOOLS: __DEV__,
  /** Log API requests/responses to console */
  LOG_API_CALLS: __DEV__,
} as const;

// Rating system
export const RATING = {
  MIN_ELO: 1000,
  MAX_ELO: 2000,
  MIN_DISPLAY: 2.0,
  MAX_DISPLAY: 6.0,
  DEFAULT_ELO: 1200,
} as const;

// Animation durations (ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PULSE: 1000,
} as const;

// API configuration
export const API = {
  BASE_URL: '', // Set from env: process.env.EXPO_PUBLIC_API_URL
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
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
