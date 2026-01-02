/**
 * Convert ELO rating to display rating (2.0 - 6.0 scale)
 * Uses a proprietary PaddleRating scale
 */
export function eloToRating(elo: number): string {
  const rating = 2.0 + ((elo - 1000) / 500) * 2.0;
  return Math.max(2.0, Math.min(6.0, rating)).toFixed(1);
}

/**
 * Convert display rating back to ELO
 */
export function ratingToElo(rating: number): number {
  return Math.round(1000 + ((rating - 2.0) / 2.0) * 500);
}

/**
 * Calculate win probability based on ELO difference
 */
export function calculateWinProbability(playerElo: number, opponentElo: number): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(expectedScore * 100);
}

/**
 * Get rating tier based on display rating
 */
export function getRatingTier(rating: number): string {
  if (rating < 2.5) return 'Beginner';
  if (rating < 3.0) return 'Novice';
  if (rating < 3.5) return 'Intermediate';
  if (rating < 4.0) return 'Advanced';
  if (rating < 4.5) return 'Expert';
  if (rating < 5.0) return 'Pro';
  return 'Elite';
}

/**
 * Format rating for display
 */
export function formatRating(elo: number): string {
  return eloToRating(elo);
}
