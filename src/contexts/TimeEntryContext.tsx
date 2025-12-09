import { createContext, useContext, useEffect, useReducer, ReactNode, useCallback, useRef } from 'react';
import type { TimeEntry } from '../types';
import { useAuth } from './AuthContext';
import timeEntryService from '../services/timeEntryService';

// 日付範囲を計算するユーティリティ関数
const getDateRange = (period: 'day' | 'week' | 'month' | 'all'): { startDate?: string; endDate?: string } => {
  const today = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  switch (period) {
    case 'day': {
      const todayStr = formatDate(today);
      return { startDate: todayStr, endDate: todayStr };
    }
    case 'week': {
      const dayOfWeek = today.getDay();
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - dayOfWeek);
      const lastDay = new Date(today);
      lastDay.setDate(today.getDate() - dayOfWeek + 6);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case 'month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }
    case 'all':
    default:
      return {};
  }
};

// 期間タイプの定義
export type TimePeriod = 'day' | 'week' | 'month' | 'all';

// 時間記録状態の型定義
interface TimeEntryState {
  timeEntries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  activeEntry: TimeEntry | null;
  currentPeriod: TimePeriod;
}

// 初期状態
const initialState: TimeEntryState = {
  timeEntries: [],
  isLoading: false,
  error: null,
  activeEntry: null,
  currentPeriod: 'day'
};

// アクション型定義
type TimeEntryAction =
  | { type: 'FETCH_ENTRIES_START' }
  | { type: 'FETCH_ENTRIES_SUCCESS'; payload: TimeEntry[] }
  | { type: 'FETCH_ENTRIES_FAILURE'; payload: string }
  | { type: 'ADD_ENTRY'; payload: TimeEntry }
  | { type: 'UPDATE_ENTRY'; payload: TimeEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'START_TIMER'; payload: TimeEntry }
  | { type: 'STOP_TIMER'; payload: TimeEntry }
  | { type: 'SET_ACTIVE_ENTRY'; payload: TimeEntry | null }
  | { type: 'SET_PERIOD'; payload: TimePeriod };

// コンテキストの型定義
interface TimeEntryContextType extends TimeEntryState {
  fetchTimeEntries: () => Promise<void>;
  fetchTimeEntriesByPeriod: (period: TimePeriod) => Promise<void>;
  setCurrentPeriod: (period: TimePeriod) => void;
  addTimeEntry: (entry: Partial<TimeEntry>) => Promise<TimeEntry>;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => Promise<TimeEntry>;
  deleteTimeEntry: (id: string) => Promise<void>;
  startTimer: (projectId: string, taskId: string, notes?: string, isBillable?: boolean) => Promise<TimeEntry>;
  stopTimer: () => Promise<TimeEntry | null>;
  resumeTimer: (id: string) => Promise<TimeEntry>;
}

// コンテキストの作成
const TimeEntryContext = createContext<TimeEntryContextType | undefined>(undefined);

// Reducer関数
const timeEntryReducer = (state: TimeEntryState, action: TimeEntryAction): TimeEntryState => {
  switch (action.type) {
    case 'FETCH_ENTRIES_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_ENTRIES_SUCCESS':
      return {
        ...state,
        isLoading: false,
        timeEntries: action.payload,
        error: null
      };
    case 'FETCH_ENTRIES_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_ENTRY':
      return {
        ...state,
        timeEntries: [...state.timeEntries, action.payload]
      };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry => 
          entry.id === action.payload.id ? action.payload : entry
        ),
        activeEntry: state.activeEntry?.id === action.payload.id 
          ? action.payload 
          : state.activeEntry
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.filter(entry => entry.id !== action.payload),
        activeEntry: state.activeEntry?.id === action.payload 
          ? null 
          : state.activeEntry
      };
    case 'START_TIMER':
      // Check if the entry already exists in timeEntries
      const entryExists = state.timeEntries.some(entry => entry.id === action.payload.id);
      return {
        ...state,
        activeEntry: action.payload,
        // Only add to timeEntries if it doesn't already exist
        timeEntries: entryExists 
          ? state.timeEntries.map(entry => 
              entry.id === action.payload.id ? action.payload : entry
            )
          : [...state.timeEntries, action.payload]
      };
    case 'STOP_TIMER':
      return {
        ...state,
        activeEntry: null,
        timeEntries: state.timeEntries.map(entry => 
          entry.id === action.payload.id ? action.payload : entry
        )
      };
    case 'SET_ACTIVE_ENTRY':
      return {
        ...state,
        activeEntry: action.payload
      };
    case 'SET_PERIOD':
      return {
        ...state,
        currentPeriod: action.payload
      };
    default:
      return state;
  }
};

// プロバイダーコンポーネント
export const TimeEntryProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(timeEntryReducer, initialState);
  const { user } = useAuth();
  // キャッシュ用のref（期間ごとにデータをキャッシュ）
  const cacheRef = useRef<Record<TimePeriod, { entries: TimeEntry[]; timestamp: number }>>({
    day: { entries: [], timestamp: 0 },
    week: { entries: [], timestamp: 0 },
    month: { entries: [], timestamp: 0 },
    all: { entries: [], timestamp: 0 }
  });
  const CACHE_TTL = 30000; // キャッシュ有効期間: 30秒

  // 期間を設定
  const setCurrentPeriod = useCallback((period: TimePeriod) => {
    dispatch({ type: 'SET_PERIOD', payload: period });
  }, []);

  // 期間指定で時間記録一覧取得
  const fetchTimeEntriesByPeriod = useCallback(async (period: TimePeriod) => {
    if (!user) return;

    // キャッシュをチェック（有効期間内ならAPIを呼ばない）
    const cached = cacheRef.current[period];
    const now = Date.now();
    if (cached.entries.length > 0 && now - cached.timestamp < CACHE_TTL) {
      dispatch({ type: 'FETCH_ENTRIES_SUCCESS', payload: cached.entries });
      dispatch({ type: 'SET_PERIOD', payload: period });
      // アクティブなタイマーをチェック
      const activeEntry = cached.entries.find(entry => entry.isRunning);
      if (activeEntry) {
        dispatch({ type: 'SET_ACTIVE_ENTRY', payload: activeEntry });
      }
      return;
    }

    dispatch({ type: 'FETCH_ENTRIES_START' });
    try {
      const dateRange = getDateRange(period);
      const entries = await timeEntryService.getMyTimeEntries(dateRange);

      // キャッシュを更新
      cacheRef.current[period] = { entries, timestamp: now };

      // アクティブなタイマーを検索
      const activeEntry = entries.find(entry => entry.isRunning);

      dispatch({ type: 'FETCH_ENTRIES_SUCCESS', payload: entries });
      dispatch({ type: 'SET_PERIOD', payload: period });
      if (activeEntry) {
        dispatch({ type: 'SET_ACTIVE_ENTRY', payload: activeEntry });
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_ENTRIES_FAILURE',
        payload: 'Failed to fetch time entries. Please try again.'
      });
    }
  }, [user]);

  // 現在の期間でデータを再取得（キャッシュを無効化）
  const fetchTimeEntries = useCallback(async () => {
    if (!user) return;

    // キャッシュを全てクリア（データが更新されたため）
    cacheRef.current = {
      day: { entries: [], timestamp: 0 },
      week: { entries: [], timestamp: 0 },
      month: { entries: [], timestamp: 0 },
      all: { entries: [], timestamp: 0 }
    };

    dispatch({ type: 'FETCH_ENTRIES_START' });
    try {
      // 現在の期間に合わせてデータを取得
      const dateRange = getDateRange(state.currentPeriod);
      const entries = await timeEntryService.getMyTimeEntries(dateRange);

      // キャッシュを更新
      cacheRef.current[state.currentPeriod] = { entries, timestamp: Date.now() };

      // アクティブなタイマーを検索
      const activeEntry = entries.find(entry => entry.isRunning);

      dispatch({ type: 'FETCH_ENTRIES_SUCCESS', payload: entries });
      if (activeEntry) {
        dispatch({ type: 'SET_ACTIVE_ENTRY', payload: activeEntry });
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_ENTRIES_FAILURE',
        payload: 'Failed to fetch time entries. Please try again.'
      });
    }
  }, [user, state.currentPeriod]);

  // 時間記録追加
  const addTimeEntry = async (entryData: Partial<TimeEntry>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // APIを使用して時間エントリーを作成
      const newEntry = await timeEntryService.createTimeEntry(entryData);
      dispatch({ type: 'ADD_ENTRY', payload: newEntry });
      return newEntry;
    } catch (error) {
      throw new Error('Failed to add time entry');
    }
  };

  // 時間記録更新
  const updateTimeEntry = async (id: string, entryData: Partial<TimeEntry>) => {
    try {
      // APIを使用して時間エントリーを更新
      const updatedEntry = await timeEntryService.updateTimeEntry(id, entryData);
      dispatch({ type: 'UPDATE_ENTRY', payload: updatedEntry });
      return updatedEntry;
    } catch (error) {
      throw new Error('Failed to update time entry');
    }
  };

  // 時間記録削除
  const deleteTimeEntry = async (id: string) => {
    try {
      // APIを使用して時間エントリーを削除
      await timeEntryService.deleteTimeEntry(id);
      dispatch({ type: 'DELETE_ENTRY', payload: id });
    } catch (error) {
      throw new Error('Failed to delete time entry');
    }
  };

  // タイマー開始
  const startTimer = async (projectId: string, taskId: string, notes?: string, isBillable?: boolean) => {
    if (!user) throw new Error('User not authenticated');
    
    // 既存のアクティブなタイマーを停止
    if (state.activeEntry) {
      await stopTimer();
    }
    
    try {
      // APIを使用してタイマーを開始
      const newEntry = await timeEntryService.startTimer(projectId, taskId, notes, isBillable);
      dispatch({ type: 'START_TIMER', payload: newEntry });
      return newEntry;
    } catch (error) {
      throw new Error('Failed to start timer');
    }
  };

  // タイマー停止
  const stopTimer = async () => {
    if (!state.activeEntry) return null;
    
    try {
      // APIを使用してタイマーを停止
      const updatedEntry = await timeEntryService.stopTimer();
      dispatch({ type: 'STOP_TIMER', payload: updatedEntry });
      return updatedEntry;
    } catch (error) {
      throw new Error('Failed to stop timer');
    }
  };

  // 既存エントリーのタイマー再開
  const resumeTimer = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // 既存のアクティブなタイマーを停止
    if (state.activeEntry) {
      await stopTimer();
    }
    
    try {
      // APIを使用してタイマーを再開
      const resumedEntry = await timeEntryService.resumeTimer(id);
      dispatch({ type: 'START_TIMER', payload: resumedEntry });
      return resumedEntry;
    } catch (error) {
      throw new Error('Failed to resume timer');
    }
  };

  // 初回マウント時に時間記録一覧を取得（Dayタブのデータのみ）
  useEffect(() => {
    if (user) {
      fetchTimeEntriesByPeriod('day');
    }
  }, [user, fetchTimeEntriesByPeriod]);

  return (
    <TimeEntryContext.Provider
      value={{
        ...state,
        fetchTimeEntries,
        fetchTimeEntriesByPeriod,
        setCurrentPeriod,
        addTimeEntry,
        updateTimeEntry,
        deleteTimeEntry,
        startTimer,
        stopTimer,
        resumeTimer
      }}
    >
      {children}
    </TimeEntryContext.Provider>
  );
};

// カスタムフック
export const useTimeEntries = () => {
  const context = useContext(TimeEntryContext);
  if (context === undefined) {
    throw new Error('useTimeEntries must be used within a TimeEntryProvider');
  }
  return context;
};