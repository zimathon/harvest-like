import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Expense } from '../types';
import { useAuth } from './AuthContext';

// 経費状態の型定義
interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
}

// 初期状態
const initialState: ExpenseState = {
  expenses: [],
  isLoading: false,
  error: null
};

// アクション型定義
type ExpenseAction = 
  | { type: 'FETCH_EXPENSES_START' }
  | { type: 'FETCH_EXPENSES_SUCCESS'; payload: Expense[] }
  | { type: 'FETCH_EXPENSES_FAILURE'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string };

// コンテキストの型定義
interface ExpenseContextType extends ExpenseState {
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
}

// コンテキストの作成
const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// Reducer関数
const expenseReducer = (state: ExpenseState, action: ExpenseAction): ExpenseState => {
  switch (action.type) {
    case 'FETCH_EXPENSES_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_EXPENSES_SUCCESS':
      return {
        ...state,
        isLoading: false,
        expenses: action.payload,
        error: null
      };
    case 'FETCH_EXPENSES_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload]
      };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense => 
          expense.id === action.payload.id ? action.payload : expense
        )
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload)
      };
    default:
      return state;
  }
};

// モックデータ
const mockExpenses: Expense[] = [
  {
    id: '1',
    userId: '1',
    projectId: '1',
    category: 'Meals & Entertainment',
    date: '2025-04-15',
    amount: 65.00,
    description: 'Client lunch meeting',
    notes: 'Discussed website requirements with client',
    status: 'approved',
    createdAt: '2025-04-15T14:30:00Z',
    updatedAt: '2025-04-16T09:15:00Z'
  },
  {
    id: '2',
    userId: '1',
    projectId: '2',
    category: 'Software',
    date: '2025-04-10',
    amount: 49.99,
    description: 'Software subscription',
    status: 'pending',
    createdAt: '2025-04-10T10:00:00Z',
    updatedAt: '2025-04-10T10:00:00Z'
  },
  {
    id: '3',
    userId: '1',
    projectId: 'general',
    category: 'Office Supplies',
    date: '2025-04-05',
    amount: 32.50,
    description: 'Office supplies',
    status: 'approved',
    createdAt: '2025-04-05T16:45:00Z',
    updatedAt: '2025-04-06T11:20:00Z'
  }
];

// プロバイダーコンポーネント
export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const { user } = useAuth();

  // 経費一覧取得
  const fetchExpenses = async () => {
    if (!user) return;
    
    dispatch({ type: 'FETCH_EXPENSES_START' });
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ローカルストレージからデータ取得を試みる
      const storedExpenses = localStorage.getItem('expenses');
      let expenses: Expense[] = [];
      
      if (storedExpenses) {
        expenses = JSON.parse(storedExpenses);
        // 現在のユーザーの経費のみをフィルタリング
        expenses = expenses.filter(expense => expense.userId === user.id);
      } else {
        // 初回はモックデータを使用
        expenses = mockExpenses;
        localStorage.setItem('expenses', JSON.stringify(expenses));
      }
      
      dispatch({ type: 'FETCH_EXPENSES_SUCCESS', payload: expenses });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_EXPENSES_FAILURE', 
        payload: 'Failed to fetch expenses. Please try again.' 
      });
    }
  };

  // 経費追加
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      const newExpense: Expense = {
        id: Date.now().toString(),
        ...expenseData,
        userId: user.id,
        createdAt: now,
        updatedAt: now
      };
      
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
      
      // ローカルストレージを更新
      const storedExpenses = localStorage.getItem('expenses');
      let expenses: Expense[] = storedExpenses ? JSON.parse(storedExpenses) : [];
      expenses.push(newExpense);
      localStorage.setItem('expenses', JSON.stringify(expenses));
      
      return newExpense;
    } catch (error) {
      throw new Error('Failed to add expense');
    }
  };

  // 経費更新
  const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 既存の経費を取得
      const storedExpenses = localStorage.getItem('expenses');
      let expenses: Expense[] = storedExpenses ? JSON.parse(storedExpenses) : [];
      const existingExpense = expenses.find(e => e.id === id);
      
      if (!existingExpense) {
        throw new Error('Expense not found');
      }
      
      // 経費を更新
      const updatedExpense: Expense = {
        ...existingExpense,
        ...expenseData,
        updatedAt: new Date().toISOString()
      };
      
      // ローカルストレージを更新
      const updatedExpenses = expenses.map(e => 
        e.id === id ? updatedExpense : e
      );
      localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      
      dispatch({ type: 'UPDATE_EXPENSE', payload: updatedExpense });
      return updatedExpense;
    } catch (error) {
      throw new Error('Failed to update expense');
    }
  };

  // 経費削除
  const deleteExpense = async (id: string) => {
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // ローカルストレージから経費を削除
      const storedExpenses = localStorage.getItem('expenses');
      let expenses: Expense[] = storedExpenses ? JSON.parse(storedExpenses) : [];
      const updatedExpenses = expenses.filter(e => e.id !== id);
      localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    } catch (error) {
      throw new Error('Failed to delete expense');
    }
  };

  // 初回マウント時に経費一覧を取得
  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  return (
    <ExpenseContext.Provider
      value={{
        ...state,
        fetchExpenses,
        addExpense,
        updateExpense,
        deleteExpense
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

// カスタムフック
export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};