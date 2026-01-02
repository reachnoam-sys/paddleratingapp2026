import { useState, useEffect, useCallback } from 'react';
import type { Player } from '../types';
import { playerService } from '../services';

interface UseNearbyPlayersResult {
  players: Player[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNearbyPlayers(): UseNearbyPlayersResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playerService.getNearbyPlayers();
      setPlayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, loading, error, refresh: fetchPlayers };
}
