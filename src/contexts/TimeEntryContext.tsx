import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { TimeEntry } from '../types';
import { useAuth } from './AuthContext';

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
  | { type: 'STOP_TIMER'; payload: TimeEntry };

// コンテキストの型定義
interface TimeEntryContextType extends TimeEntryState {
  fetchTimeEntries: () => Promise<void>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeEntry>;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => Promise<TimeEntry>;
  deleteTimeEntry: (id: string) => Promise<void>;
  startTimer: (projectId: string, taskId: string, notes?: string) => Promise<TimeEntry>;
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
      return {
        ...state,
        activeEntry: action.payload,
        timeEntries: [...state.timeEntries, action.payload]
      };
    case 'STOP_TIMER':
      return {
        ...state,
        activeEntry: null,
        timeEntries: state.timeEntries.map(entry => 
          entry.id === action.payload.id ? action.payload : entry
        )
      };
    default:
      return state;
  }
};

// モックデータ
const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    userId: '1',
    projectId: '1',
    taskId: '1',
    date: '2025-04-19',
    duration: 2.5,
    notes: 'Working on homepage redesign',
    isBillable: true,
    isRunning: false,
    createdAt: '2025-04-19T09:00:00Z',
    updatedAt: '2025-04-19T11:30:00Z'
  },
  {
    id: '2',
    userId: '1',
    projectId: '2',
    taskId: '2',
    date: '2025-04-19',
    duration: 1.75,
    notes: 'Mobile app UI implementation',
    isBillable: true,
    isRunning: false,
    createdAt: '2025-04-19T13:00:00Z',
    updatedAt: '2025-04-19T14:45:00Z'
  },
  {
    id: '3',
    userId: '1',
    projectId: '1',
    taskId: '3',
    date: '2025-04-18',
    duration: 1,
    notes: 'Team meeting',
    isBillable: false,
    isRunning: false,
    createdAt: '2025-04-18T15:00:00Z',
    updatedAt: '2025-04-18T16:00:00Z'
  }
];

// プロバイダーコンポーネント
export const TimeEntryProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(timeEntryReducer, initialState);
  const { user } = useAuth();

  // 時間記録一覧取得
  const fetchTimeEntries = async () => {
    if (!user) return;
    
    dispatch({ type: 'FETCH_ENTRIES_START' });
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ローカルストレージからデータ取得を試みる
      const storedEntries = localStorage.getItem('timeEntries');
      let entries: TimeEntry[] = [];
      
      if (storedEntries) {
        entries = JSON.parse(storedEntries);
        // 現在のユーザーのエントリーのみをフィルタリング
        entries = entries.filter(entry => entry.userId === user.id);
      } else {
        // 初回はモックデータを使用
        entries = mockTimeEntries;
        localStorage.setItem('timeEntries', JSON.stringify(entries));
      }
      
      // アクティブなタイマーを検索
      const activeEntry = entries.find(entry => entry.isRunning);
      
      dispatch({ type: 'FETCH_ENTRIES_SUCCESS', payload: entries });
      if (activeEntry) {
        dispatch({ type: 'START_TIMER', payload: activeEntry });
      }
    } catch (error) {
      dispatch({ 
        type: 'FETCH_ENTRIES_FAILURE', 
        payload: 'Failed to fetch time entries. Please try again.' 
      });
    }
  };

  // 時間記録追加
  const addTimeEntry = async (entryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        ...entryData,
        userId: user.id,
        createdAt: now,
        updatedAt: now
      };
      
      dispatch({ type: 'ADD_ENTRY', payload: newEntry });
      
      // ローカルストレージを更新
      const storedEntries = localStorage.getItem('timeEntries');
      let entries: TimeEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
      entries.push(newEntry);
      localStorage.setItem('timeEntries', JSON.stringify(entries));
      
      return newEntry;
    } catch (error) {
      throw new Error('Failed to add time entry');
    }
  };

  // 時間記録更新
  const updateTimeEntry = async (id: string, entryData: Partial<TimeEntry>) => {
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 既存エントリーを取得
      const storedEntries = localStorage.getItem('timeEntries');
      let entries: TimeEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
      const existingEntry = entries.find(e => e.id === id);
      
      if (!existingEntry) {
        throw new Error('Time entry not found');
      }
      
      // エントリーを更新
      const updatedEntry: TimeEntry = {
        ...existingEntry,
        ...entryData,
        updatedAt: new Date().toISOString()
      };
      
      // ローカルストレージを更新
      const updatedEntries = entries.map(e => 
        e.id === id ? updatedEntry : e
      );
      localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
      
      dispatch({ type: 'UPDATE_ENTRY', payload: updatedEntry });
      return updatedEntry;
    } catch (error) {
      throw new Error('Failed to update time entry');
    }
  };

  // 時間記録削除
  const deleteTimeEntry = async (id: string) => {
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // ローカルストレージからエントリーを削除
      const storedEntries = localStorage.getItem('timeEntries');
      let entries: TimeEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
      const updatedEntries = entries.filter(e => e.id !== id);
      localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
      
      dispatch({ type: 'DELETE_ENTRY', payload: id });
    } catch (error) {
      throw new Error('Failed to delete time entry');
    }
  };

  // タイマー開始
  const startTimer = async (projectId: string, taskId: string, notes?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // 既存のアクティブなタイマーを停止
    if (state.activeEntry) {
      await stopTimer();
    }
    
    try {
      const now = new Date();
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        userId: user.id,
        projectId,
        taskId,
        date: now.toISOString().split('T')[0],
        startTime: now.toISOString(),
        duration: 0,
        notes: notes || '',
        isBillable: true,
        isRunning: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      // ローカルストレージを更新
      const storedEntries = localStorage.getItem('timeEntries');
      let entries: TimeEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
      entries.push(newEntry);
      localStorage.setItem('timeEntries', JSON.stringify(entries));
      
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
      const now = new Date();
      const startTime = new Date(state.activeEntry.startTime || now);
      const durationInHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // 既存のdurationに追加（累積時間）
      const totalDuration = state.activeEntry.duration + durationInHours;
      
      const updatedEntry: TimeEntry = {
        ...state.activeEntry,
        endTime: now.toISOString(),
        duration: Math.round(totalDuration * 100) / 100, // 小数点2桁に丸める
        isRunning: false,
        updatedAt: now.toISOString()
      };
      
      // ローカルストレージを更新
      const storedEntries = localStorage.getItem('timeEntries');
      let entries: TimeEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
      const updatedEntries = entries.map(e => 
        e.id === updatedEntry.id ? updatedEntry : e
      );
      localStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
      
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
  }, [user]);

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