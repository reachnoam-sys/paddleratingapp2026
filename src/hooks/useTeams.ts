import { useState, useEffect, useCallback } from 'react';
import type { Player, Team } from '../types';
import { teamService } from '../services';

interface UseTeamsResult {
  teams: Team[];
  lookingForPartner: Player[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTeams(): UseTeamsResult {
  const [teams, setTeams] = useState<Team[]>([]);
  const [lookingForPartner, setLookingForPartner] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamsData, partnerData] = await Promise.all([
        teamService.getTeams(),
        teamService.getLookingForPartner(),
      ]);
      setTeams(teamsData);
      setLookingForPartner(partnerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { teams, lookingForPartner, loading, error, refresh: fetchData };
}
