import type { Player, Team, CurrentUser } from '../types';

export const currentUser: CurrentUser = {
  id: 'current-user',
  name: 'You',
  avatar: 'https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?w=200&h=200&fit=crop',
  elo: 1250,
};

export const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Sarah Martinez',
    avatar: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=200&h=200&fit=crop',
    elo: 1420,
    status: 'Waiting',
  },
  {
    id: '2',
    name: 'Jake Thompson',
    avatar: 'https://images.unsplash.com/photo-1750521281030-964a37f24cb9?w=200&h=200&fit=crop',
    elo: 1180,
    status: 'Ready',
  },
  {
    id: '3',
    name: 'Emily Chen',
    avatar: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=200&h=200&fit=crop',
    elo: 1350,
    status: 'On Court 2',
  },
  {
    id: '4',
    name: 'Marcus Johnson',
    avatar: 'https://images.unsplash.com/photo-1545151414-8a948e1ea54f?w=200&h=200&fit=crop',
    elo: 1290,
    status: 'Waiting',
  },
  {
    id: '5',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?w=200&h=200&fit=crop',
    elo: 1150,
    status: 'On Court 1',
  },
  {
    id: '6',
    name: 'Nina Patel',
    avatar: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=200&h=200&fit=crop',
    elo: 1380,
    status: 'Ready',
  },
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'The Smash Bros',
    player1: {
      name: 'Sarah Martinez',
      avatar: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=200&h=200&fit=crop',
      elo: 1420,
    },
    player2: {
      name: 'Marcus Johnson',
      avatar: 'https://images.unsplash.com/photo-1545151414-8a948e1ea54f?w=200&h=200&fit=crop',
      elo: 1290,
    },
    combinedElo: 2710,
    status: 'Waiting',
  },
  {
    id: 't2',
    name: 'Court Kings',
    player1: {
      name: 'Emily Chen',
      avatar: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=200&h=200&fit=crop',
      elo: 1350,
    },
    player2: {
      name: 'Nina Patel',
      avatar: 'https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=200&h=200&fit=crop',
      elo: 1380,
    },
    combinedElo: 2730,
    status: 'On Court 2',
  },
  {
    id: 't3',
    name: 'Dink Masters',
    player1: {
      name: 'Jake Thompson',
      avatar: 'https://images.unsplash.com/photo-1750521281030-964a37f24cb9?w=200&h=200&fit=crop',
      elo: 1180,
    },
    player2: {
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&h=200&fit=crop',
      elo: 1150,
    },
    combinedElo: 2330,
    status: 'Ready',
  },
];

export const mockLookingForPartner: Player[] = [
  {
    id: 'p1',
    name: 'David Lee',
    avatar: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&h=200&fit=crop',
    elo: 1310,
    status: 'Waiting',
  },
  {
    id: 'p2',
    name: 'Rachel Kim',
    avatar: 'https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=200&h=200&fit=crop',
    elo: 1460,
    status: 'Waiting',
  },
  {
    id: 'p3',
    name: 'Tom Wilson',
    avatar: 'https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?w=200&h=200&fit=crop',
    elo: 1220,
    status: 'Waiting',
  },
];
