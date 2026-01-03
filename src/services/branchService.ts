/**
 * Branch.io Deep Linking Service
 *
 * Provides deferred deep linking for app installs via invite links.
 * When a user clicks an invite link and doesn't have the app:
 * 1. They're redirected to the App Store
 * 2. After install, the app receives the original link data
 * 3. User is taken directly to the court they were invited to
 *
 * Setup requirements (do once in production):
 * 1. Create Branch.io account at https://branch.io
 * 2. Get Branch keys from dashboard
 * 3. Add keys to app.json under extra.branch
 * 4. Configure iOS/Android build settings
 */

import { Platform } from 'react-native';

// Branch SDK types (simplified for flexibility)
interface BranchParams {
  '+clicked_branch_link'?: boolean;
  '+is_first_session'?: boolean;
  '+match_guaranteed'?: boolean;
  '+referring_link'?: string;
  courtId?: string;
  ref?: string;
  [key: string]: string | boolean | undefined;
}

// Callback for handling deep link events
type DeepLinkHandler = (params: { courtId?: string; ref?: string }) => void;

let deepLinkHandler: DeepLinkHandler | null = null;
let unsubscribe: (() => void) | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let branchModule: any = null;

// Initialize Branch lazily
async function getBranch() {
  if (branchModule) return branchModule;

  try {
    // Dynamic import to avoid crashes during development
    const module = await import('react-native-branch');
    branchModule = module.default;
    return branchModule;
  } catch (error) {
    console.warn('[Branch] SDK not available:', error);
    return null;
  }
}

/**
 * Initialize Branch deep linking
 * Call this once at app startup
 */
export async function initBranch(onDeepLink: DeepLinkHandler): Promise<void> {
  deepLinkHandler = onDeepLink;

  const branch = await getBranch();
  if (!branch) {
    console.warn('[Branch] Skipping initialization - SDK not available');
    return;
  }

  // Subscribe to Branch deep link events
  unsubscribe = branch.subscribe({
    onOpenStart: () => {
      console.log('[Branch] Opening link...');
    },
    onOpenComplete: ({
      error,
      params,
    }: {
      error: string | null;
      params: BranchParams | null;
    }) => {
      if (error) {
        console.error('[Branch] Error:', error);
        return;
      }

      if (!params || !params['+clicked_branch_link']) {
        // Not a Branch deep link
        return;
      }

      console.log('[Branch] Received deep link:', params);

      // Extract court invite data
      const courtId = params.courtId;
      const ref = params.ref;

      if (courtId && deepLinkHandler) {
        deepLinkHandler({ courtId, ref });
      }
    },
  });
}

/**
 * Cleanup Branch subscriptions
 * Call this on app unmount
 */
export function cleanupBranch(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  deepLinkHandler = null;
}

/**
 * Generate a Branch short link for court invites
 * This link works for both existing users and new installs
 */
export async function generateBranchInviteLink(
  courtId: string,
  courtName: string,
  userId: string
): Promise<string> {
  const branch = await getBranch();

  // Fallback to regular deep link if Branch isn't available
  if (!branch) {
    return `https://paddlerating.app/court/${courtId}?ref=${userId}`;
  }

  try {
    // Create a Branch Universal Object for the court
    const branchObject = await branch.createBranchUniversalObject(
      `court/${courtId}`,
      {
        title: `Join me at ${courtName}`,
        contentDescription: `Play pickleball at ${courtName} on PaddleRating`,
        contentImageUrl: 'https://paddlerating.app/og-image.png',
        contentMetadata: {
          customMetadata: {
            courtId,
            ref: userId,
          },
        },
      }
    );

    // Generate a short URL
    const { url } = await branchObject.generateShortUrl(
      {
        feature: 'invite',
        channel: 'app',
        campaign: 'court-invite',
      },
      {
        // Fallback URL for web (App Store if not installed)
        $fallback_url: `https://paddlerating.app/court/${courtId}?ref=${userId}`,
        $ios_url: Platform.OS === 'ios'
          ? 'https://apps.apple.com/app/paddlerating/id1234567890' // Replace with actual App Store URL
          : undefined,
        $android_url: Platform.OS === 'android'
          ? 'https://play.google.com/store/apps/details?id=com.paddlerating.app'
          : undefined,
        // Custom data passed through install
        courtId,
        ref: userId,
      }
    );

    return url;
  } catch (error) {
    console.error('[Branch] Failed to generate link:', error);
    // Fallback to regular deep link
    return `https://paddlerating.app/court/${courtId}?ref=${userId}`;
  }
}

/**
 * Check if this is the first session after install from a Branch link
 * Useful for onboarding flows
 */
export function isFirstSessionFromBranch(params: BranchParams): boolean {
  return (
    params['+clicked_branch_link'] === true &&
    params['+is_first_session'] === true
  );
}
