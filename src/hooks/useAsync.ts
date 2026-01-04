// useAsync - Generic hook for async operations with loading/error states
import { useState, useCallback } from 'react';
import type { ApiError, AsyncState } from '../services/types';
import { createApiError, ERROR_CODES } from '../services/types';

/**
 * Generic hook for managing async operations
 *
 * @example
 * ```tsx
 * const { execute, loading, error, data } = useAsync(playerService.getNearbyPlayers);
 *
 * useEffect(() => {
 *   execute();
 * }, []);
 *
 * if (loading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 * return <PlayerList players={data} />;
 * ```
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options?: {
    /** Initial data before first load */
    initialData?: T;
    /** Callback on success */
    onSuccess?: (data: T) => void;
    /** Callback on error */
    onError?: (error: ApiError) => void;
  }
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: options?.initialData ?? null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = await asyncFn(...args);
        setState({ data, loading: false, error: null });
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const apiError = normalizeError(err);
        setState(prev => ({ ...prev, loading: false, error: apiError }));
        options?.onError?.(apiError);
        return null;
      }
    },
    [asyncFn, options?.onSuccess, options?.onError]
  );

  const reset = useCallback(() => {
    setState({
      data: options?.initialData ?? null,
      loading: false,
      error: null,
    });
  }, [options?.initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    /** Convenience: true if no data and not loading */
    isEmpty: !state.data && !state.loading,
    /** Convenience: true if has data (even if stale) */
    hasData: state.data !== null,
  };
}

/**
 * Normalize any error into ApiError format
 */
function normalizeError(err: unknown): ApiError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return err as ApiError;
  }

  if (err instanceof Error) {
    // Network errors
    if (err.message.includes('Network') || err.message.includes('fetch')) {
      return createApiError(ERROR_CODES.NETWORK_ERROR, 'Unable to connect. Check your internet connection.');
    }
    // Timeout
    if (err.message.includes('timeout') || err.message.includes('Timeout')) {
      return createApiError(ERROR_CODES.TIMEOUT, 'Request timed out. Please try again.');
    }
    return createApiError(ERROR_CODES.UNKNOWN, err.message);
  }

  return createApiError(ERROR_CODES.UNKNOWN, 'An unexpected error occurred');
}

export default useAsync;
