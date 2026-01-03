import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from './types';

// Create the deep link prefix for the app
const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    'paddlerating://',
    'https://paddlerating.app',
    'https://www.paddlerating.app',
  ],
  config: {
    screens: {
      Home: {
        path: '',
        parse: {
          courtId: (courtId: string) => courtId,
          ref: (ref: string) => ref,
        },
      },
      Court: {
        path: 'court/:courtId',
        parse: {
          courtId: (courtId: string) => courtId,
          ref: (ref: string) => ref,
        },
      },
      CourtsMap: 'courts',
      Profile: {
        path: 'profile/:userId?',
        parse: {
          userId: (userId: string) => userId,
        },
      },
      Settings: 'settings',
      MatchHistory: 'history',
      Challenge: {
        path: 'challenge/:playerId',
        parse: {
          playerId: (playerId: string) => playerId,
        },
      },
      FindPartner: 'find-partner',
    },
  },
  // Handle incoming links
  async getInitialURL() {
    // First, check if the app was opened via a deep link
    const url = await Linking.getInitialURL();

    if (url != null) {
      return url;
    }

    // If no deep link, return null to use the default route
    return null;
  },
  // Subscribe to incoming links while the app is open
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    return () => {
      subscription.remove();
    };
  },
};

// Helper to generate invite links
export function generateInviteLink(courtId: string, userId: string): string {
  return `https://paddlerating.app/court/${courtId}?ref=${userId}`;
}

// Helper to parse invite link params
export function parseInviteLink(url: string): { courtId?: string; ref?: string } | null {
  try {
    const parsed = Linking.parse(url);

    // Handle court/:courtId path
    if (parsed.path?.startsWith('court/')) {
      const courtId = parsed.path.replace('court/', '');
      return {
        courtId,
        ref: parsed.queryParams?.ref as string | undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}
