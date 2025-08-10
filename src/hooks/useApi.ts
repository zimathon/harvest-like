import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import type {
  TimeEntry,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  StartTimerRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../lib/api-client';

// Generic hook for API calls with loading and error states
export function useApiCall<TArgs extends any[], TReturn>(
  apiFunction: (...args: TArgs) => Promise<TReturn>
) {
  const [data, setData] = useState<TReturn | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return { data, loading, error, execute };
}

// Hook for fetching data on component mount
export function useApiQuery<TReturn>(
  apiFunction: () => Promise<TReturn>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<TReturn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
}

// Specific hooks for different resources

// Auth hooks
export function useLogin() {
  return useApiCall(apiClient.login.bind(apiClient));
}

export function useRegister() {
  return useApiCall(apiClient.register.bind(apiClient));
}

export function useCurrentUser() {
  return useApiQuery(() => apiClient.getMe(), []);
}

// Time entries hooks
export function useTimeEntries(params?: {
  project?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useApiQuery(
    () => apiClient.getMyTimeEntries(params),
    [params?.project, params?.startDate, params?.endDate]
  );
}

export function useTimeEntry(id: string) {
  return useApiQuery(() => apiClient.getTimeEntry(id), [id]);
}

export function useCreateTimeEntry() {
  return useApiCall((data: CreateTimeEntryRequest) => apiClient.createTimeEntry(data));
}

export function useUpdateTimeEntry() {
  return useApiCall((id: string, data: UpdateTimeEntryRequest) =>
    apiClient.updateTimeEntry(id, data)
  );
}

export function useDeleteTimeEntry() {
  return useApiCall((id: string) => apiClient.deleteTimeEntry(id));
}

export function useStartTimer() {
  return useApiCall((data: StartTimerRequest) => apiClient.startTimer(data));
}

export function useStopTimer() {
  return useApiCall((notes?: string) => apiClient.stopTimer(notes));
}

// Projects hooks
export function useProjects() {
  return useApiQuery(() => apiClient.getProjects(), []);
}

export function useProject(id: string) {
  return useApiQuery(() => apiClient.getProject(id), [id]);
}

export function useCreateProject() {
  return useApiCall((data: CreateProjectRequest) => apiClient.createProject(data));
}

export function useUpdateProject() {
  return useApiCall((id: string, data: UpdateProjectRequest) =>
    apiClient.updateProject(id, data)
  );
}

export function useDeleteProject() {
  return useApiCall((id: string) => apiClient.deleteProject(id));
}

// Timer state hook
export function useTimer() {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const start = useCallback(
    async (data: StartTimerRequest) => {
      const response = await startTimer.execute(data);
      if (response?.data) {
        setActiveTimer(response.data);
      }
      return response;
    },
    [startTimer]
  );

  const stop = useCallback(
    async (notes?: string) => {
      const response = await stopTimer.execute(notes);
      setActiveTimer(null);
      return response;
    },
    [stopTimer]
  );

  return {
    activeTimer,
    start,
    stop,
    starting: startTimer.loading,
    stopping: stopTimer.loading,
    error: startTimer.error || stopTimer.error,
  };
}