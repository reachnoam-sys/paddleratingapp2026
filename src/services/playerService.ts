import type { Player, Team, CurrentUser } from '../types';
import { mockPlayers, mockTeams, mockLookingForPartner, currentUser } from '../data';

// Simulated delay to mimic API calls
const simulateDelay = (ms: number = 500) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const playerService = {
  // Get current user - will connect to auth later
  getCurrentUser: async (): Promise<CurrentUser> => {
    await simulateDelay(100);
    return currentUser;
  },

  // Get nearby players for singles mode
  getNearbyPlayers: async (): Promise<Player[]> => {
    await simulateDelay();
    // TODO: Replace with API call
    // return api.get('/players/nearby');
    return mockPlayers;
  },

  // Get a single player by ID
  getPlayerById: async (id: string): Promise<Player | null> => {
    await simulateDelay(200);
    return mockPlayers.find(p => p.id === id) || null;
  },

  // Challenge a player
  challengePlayer: async (playerId: string, message?: string): Promise<{ success: boolean }> => {
    await simulateDelay(300);
    console.log('Challenge sent to player:', playerId, message);
    // TODO: Replace with API call
    // return api.post('/challenges', { playerId, message });
    return { success: true };
  },

  // Update player status
  updateStatus: async (status: Player['status']): Promise<{ success: boolean }> => {
    await simulateDelay(200);
    // TODO: Replace with API call
    return { success: true };
  },
};

export const teamService = {
  // Get formed teams for doubles mode
  getTeams: async (): Promise<Team[]> => {
    await simulateDelay();
    // TODO: Replace with API call
    return mockTeams;
  },

  // Get players looking for a partner
  getLookingForPartner: async (): Promise<Player[]> => {
    await simulateDelay();
    // TODO: Replace with API call
    return mockLookingForPartner;
  },

  // Invite a player to be your partner
  invitePartner: async (playerId: string): Promise<{ success: boolean; teamId: string }> => {
    await simulateDelay(300);
    // TODO: Replace with API call
    return { success: true, teamId: `team-${Date.now()}` };
  },

  // Leave current team
  leaveTeam: async (teamId: string): Promise<{ success: boolean }> => {
    await simulateDelay(200);
    // TODO: Replace with API call
    return { success: true };
  },

  // Challenge another team
  challengeTeam: async (teamId: string): Promise<{ success: boolean }> => {
    await simulateDelay(300);
    console.log('Challenge sent to team:', teamId);
    // TODO: Replace with API call
    return { success: true };
  },
};

export const locationService = {
  // Get current location/court
  getCurrentLocation: async (): Promise<{ name: string; id: string }> => {
    await simulateDelay(100);
    // TODO: Replace with geolocation + API call
    return { name: 'Lincoln Park Courts', id: 'loc-1' };
  },

  // Check in at a location
  checkIn: async (locationId: string): Promise<{ success: boolean }> => {
    await simulateDelay(300);
    // TODO: Replace with API call
    return { success: true };
  },
};
