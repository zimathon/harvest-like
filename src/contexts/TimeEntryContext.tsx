import { createContext, useContext, useEffect, useReducer, ReactNode, useCallback } from 'react';
import { TimeEntry } from '../types';
import { useAuth } from './AuthContext';
import * as timeEntryService from '../services/timeEntryService';

// 時間記録状態の型定義
interface TimeEntryState {
  timeEntries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  activeEntry: TimeEntry | null;
}

// 初期状態
const initialState: TimeEntryState = {
  timeEntries: [],
  isLoading: false,
  error: null,
  activeEntry: null
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
  | { type: 'SET_ACTIVE_ENTRY'; payload: TimeEntry | null };

// コンテキストの型定義
interface TimeEntryContextType extends TimeEntryState {
  fetchTimeEntries: () => Promise<void>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeEntry>;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => Promise<TimeEntry>;
  deleteTimeEntry: (id: string) => Promise<void>;
  startTimer: (projectId: string, taskId: string, notes?: string, isBillable?: boolean) => Promise<TimeEntry>;
  stopTimer: () => Promise<TimeEntry | null>;
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
    default:
      return state;
  }
};

// プロバイダーコンポーネント
export const TimeEntryProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(timeEntryReducer, initialState);
  const { user } = useAuth();

  // 時間記録一覧取得
  const fetchTimeEntries = useCallback(async () => {
    if (!user) return;
    
    dispatch({ type: 'FETCH_ENTRIES_START' });
    try {
      // APIから時間エントリーを取得
      const entries = await timeEntryService.getMyTimeEntries();
      
      // アクティブなタイマーを検索
      const activeEntry = entries.find(entry => entry.isRunning);
      
      dispatch({ type: 'FETCH_ENTRIES_SUCCESS', payload: entries });
      if (activeEntry) {
        // Use SET_ACTIVE_ENTRY instead of START_TIMER to avoid duplicating the entry
        dispatch({ type: 'SET_ACTIVE_ENTRY', payload: activeEntry });
      }
    } catch (error) {
      dispatch({ 
        type: 'FETCH_ENTRIES_FAILURE', 
        payload: 'Failed to fetch time entries. Please try again.' 
      });
    }
  }, [user]);

  // 時間記録追加
  const addTimeEntry = async (entryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
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

  // 初回マウント時に時間記録一覧を取得
  useEffect(() => {
    if (user) {
      fetchTimeEntries();
    }
  }, [user, fetchTimeEntries]);

  return (
    <TimeEntryContext.Provider
      value={{
        ...state,
        fetchTimeEntries,
        addTimeEntry,
        updateTimeEntry,
        deleteTimeEntry,
        startTimer,
        stopTimer
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