import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import * as invoiceService from '../services/invoiceService';
import { Invoice } from '../types';
import { useAuth } from './AuthContext.js'; // useAuthフックをインポート

// 請求書状態の型定義
interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
}

// 初期状態
const initialState: InvoiceState = {
  invoices: [],
  isLoading: false,
  error: null,
};

// アクション型定義
type InvoiceAction =
  | { type: 'FETCH_INVOICES_START' }
  | { type: 'FETCH_INVOICES_SUCCESS'; payload: Invoice[] }
  | { type: 'FETCH_INVOICES_FAILURE'; payload: string };

// コンテキストの型定義
interface InvoiceContextType extends InvoiceState {
  fetchInvoices: () => Promise<void>;
}

// コンテキストの作成
const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

// Reducer関数
const invoiceReducer = (state: InvoiceState, action: InvoiceAction): InvoiceState => {
  switch (action.type) {
    case 'FETCH_INVOICES_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_INVOICES_SUCCESS':
      return { ...state, isLoading: false, invoices: action.payload, error: null };
    case 'FETCH_INVOICES_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

// プロバイダーコンポーネント
export const InvoiceProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);
  const { isAuthenticated } = useAuth(); // AuthContextから認証状態を取得

  // 請求書一覧取得
  const fetchInvoices = async () => {
    dispatch({ type: 'FETCH_INVOICES_START' });
    try {
      const invoices = await invoiceService.getInvoices(); // APIから取得
      dispatch({ type: 'FETCH_INVOICES_SUCCESS', payload: invoices });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch invoices';
      console.error("Error fetching invoices:", error);
      dispatch({ type: 'FETCH_INVOICES_FAILURE', payload: message });
    }
  };

  // 初回マウント時、または認証状態が変化したときに請求書一覧を取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
    }
  }, [isAuthenticated]);

  return (
    <InvoiceContext.Provider
      value={{
        ...state,
        fetchInvoices,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

// カスタムフック
export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};