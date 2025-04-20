import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { Expense } from '../types';
import { useAuth } from './AuthContext.js';
import * as expenseService from '../services/expenseService';

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

// プロバイダーコンポーネント
export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const { user } = useAuth();

  // 経費一覧取得
  const fetchExpenses = async () => {
    if (!user) return;

    dispatch({ type: 'FETCH_EXPENSES_START' });
    try {
      // APIを使用して経費一覧を取得
      const expenses = await expenseService.getMyExpenses();
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
      // APIを使用して経費を追加
      const newExpense = await expenseService.createExpense(expenseData);
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
      return newExpense;
    } catch (error) {
      throw new Error('Failed to add expense');
    }
  };

  // 経費更新
  const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    try {
      // APIを使用して経費を更新
      const updatedExpense = await expenseService.updateExpense(id, expenseData);
      dispatch({ type: 'UPDATE_EXPENSE', payload: updatedExpense });
      return updatedExpense;
    } catch (error) {
      throw new Error('Failed to update expense');
    }
  };

  // 経費削除
  const deleteExpense = async (id: string) => {
    try {
      // APIを使用して経費を削除
      await expenseService.deleteExpense(id);
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