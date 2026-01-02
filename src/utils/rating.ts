/**
 * Convert ELO rating to DUPR rating display
 * DUPR ranges from 2.0 to 8.0 (though we cap at 6.0 for this app)
 */
export function eloToDupr(elo: number): string {
  const dupr = 2.0 + ((elo - 1000) / 500) * 2.0;
  return Math.max(2.0, Math.min(6.0, dupr)).toFixed(1);
}

/**
 * Convert DUPR rating back to ELO
 */
export function duprToElo(dupr: number): number {
  return Math.round(1000 + ((dupr - 2.0) / 2.0) * 500);
}

/**
 * Calculate win probability based on ELO difference
 */
export function calculateWinProbability(playerElo: number, opponentElo: number): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(expectedScore * 100);
}

/**
 * Get rating tier based on DUPR
 */
export function getRatingTier(dupr: number): string {
  if (dupr < 2.5) return 'Beginner';
  if (dupr < 3.0) return 'Novice';
  if (dupr < 3.5) return 'Intermediate';
  if (dupr < 4.0) return 'Advanced';
  if (dupr < 4.5) return 'Expert';
  if (dupr < 5.0) return 'Pro';
  return 'Elite';
}

/**
 * Format rating for display
 */
export function formatRating(elo: number): string {
  return eloToDupr(elo);
}
