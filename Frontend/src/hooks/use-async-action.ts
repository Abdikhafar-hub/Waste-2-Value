"use client";

import { useCallback, useMemo, useState } from "react";

interface AsyncActionState {
  loading: boolean;
  error: string | null;
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<AsyncActionState>({ loading: false, error: null });

  const execute = useCallback(
    async (...args: TArgs) => {
      setState({ loading: true, error: null });

      try {
        const response = await action(...args);
        setState({ loading: false, error: null });
        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Action failed.";
        setState({ loading: false, error: message });
        throw new Error(message);
      }
    },
    [action],
  );

  return useMemo(
    () => ({ execute, loading: state.loading, error: state.error, clearError: () => setState((prev) => ({ ...prev, error: null })) }),
    [execute, state.error, state.loading],
  );
}
