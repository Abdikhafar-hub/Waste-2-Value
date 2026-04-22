"use client";

import { type DependencyList, useCallback, useEffect, useState } from "react";

interface AsyncResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useAsyncResource<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [state, setState] = useState<AsyncResourceState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await loader();
      setState({ data: response, error: null, loading: false });
    } catch (error) {
      setState({
        data: null,
        error: error instanceof Error ? error.message : "Something went wrong.",
        loading: false,
      });
    }
  }, [loader]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: execute };
}
