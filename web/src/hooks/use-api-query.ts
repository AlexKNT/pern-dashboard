import { useCallback, useEffect, useRef, useState } from "react";

type QueryState<T> = { data: T | null; isLoading: boolean; error: unknown };

/**
 * A small fetch based query for the API client: data, loading and error state,
 * plus a refetch that resets to loading before the next request. State updates
 * happen in the promise callbacks, never synchronously in the effect body.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  enabled = true,
): { data: T | null; isLoading: boolean; error: unknown; refetch: () => void } {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetcherRef
      .current()
      .then((data) => {
        if (active) setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, isLoading: false, error });
      });
    return () => {
      active = false;
    };
  }, [enabled, nonce]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    setNonce((value) => value + 1);
  }, []);

  return { ...state, refetch };
}
