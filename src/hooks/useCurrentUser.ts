import { useState, useEffect } from 'react';
import type { CurrentUser, CurrentTeam, Player } from '../types';
import { playerService, teamService } from '../services';

interface UseCurrentUserResult {
  user: CurrentUser | null;
  currentTeam: CurrentTeam | null;
  loading: boolean;
  error: string | null;
  invitePartner: (player: Player) => Promise<void>;
  leaveTeam: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [currentTeam, setCurrentTeam] = useState<CurrentTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await playerService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const invitePartner = async (player: Player) => {
    if (!user) return;

    try {
      const result = await teamService.invitePartner(player.id);
      if (result.success) {
        setCurrentTeam({
          id: result.teamId,
          partner: player,
          combinedElo: user.elo + player.elo,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite partner');
    }
  };

  const leaveTeam = async () => {
    if (!currentTeam) return;

    try {
      const result = await teamService.leaveTeam(currentTeam.id);
      if (result.success) {
        setCurrentTeam(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    }
  };

  return { user, currentTeam, loading, error, invitePartner, leaveTeam };
}
