import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import * as userService from '../services/userService';
import { User } from '../types';
import { useAuth } from './AuthContext.js'; // useAuthフックをインポート

// ユーザー状態の型定義
interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

// 初期状態
const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
};

// アクション型定義
type UserAction =
  | { type: 'FETCH_USERS_START' }
  | { type: 'FETCH_USERS_SUCCESS'; payload: User[] }
  | { type: 'FETCH_USERS_FAILURE'; payload: string };

// コンテキストの型定義
interface UserContextType extends UserState {
  fetchUsers: () => Promise<void>;
}

// コンテキストの作成
const UserContext = createContext<UserContextType | undefined>(undefined);

// Reducer関数
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'FETCH_USERS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_USERS_SUCCESS':
      return { ...state, isLoading: false, users: action.payload, error: null };
    case 'FETCH_USERS_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

// プロバイダーコンポーネント
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const { isAuthenticated } = useAuth(); // AuthContextから認証状態を取得

  // ユーザー一覧取得
  const fetchUsers = async () => {
    dispatch({ type: 'FETCH_USERS_START' });
    try {
      const users = await userService.getUsers(); // APIから取得
      dispatch({ type: 'FETCH_USERS_SUCCESS', payload: users });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users';
      console.error("Error fetching users:", error);
      dispatch({ type: 'FETCH_USERS_FAILURE', payload: message });
    }
  };

  // 初回マウント時、または認証状態が変化したときにユーザー一覧を取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  return (
    <UserContext.Provider
      value={{
        ...state,
        fetchUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// カスタムフック
export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};