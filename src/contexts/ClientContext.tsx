import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import * as clientService from '../services/clientService.js'; // APIサービスをインポート
import { Client } from '../types/index.js'; // Client 型をインポート

// クライアント状態の型定義
interface ClientState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
}

// 初期状態
const initialState: ClientState = {
  clients: [],
  isLoading: false,
  error: null,
};

// アクション型定義
type ClientAction =
  | { type: 'FETCH_CLIENTS_START' }
  | { type: 'FETCH_CLIENTS_SUCCESS'; payload: Client[] }
  | { type: 'FETCH_CLIENTS_FAILURE'; payload: string }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string };

// コンテキストの型定義
interface ClientContextType extends ClientState {
  fetchClients: () => Promise<void>;
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

// コンテキストの作成
const ClientContext = createContext<ClientContextType | undefined>(undefined);

// Reducer関数
const clientReducer = (state: ClientState, action: ClientAction): ClientState => {
  switch (action.type) {
    case 'FETCH_CLIENTS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_CLIENTS_SUCCESS':
      return { ...state, isLoading: false, clients: action.payload, error: null };
    case 'FETCH_CLIENTS_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id ? action.payload : client
        ),
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload),
      };
    default:
      return state;
  }
};

// プロバイダーコンポーネント
export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(clientReducer, initialState);

  // クライアント一覧取得
  const fetchClients = async () => {
    dispatch({ type: 'FETCH_CLIENTS_START' });
    try {
      const clients = await clientService.getClients(); // APIから取得
      dispatch({ type: 'FETCH_CLIENTS_SUCCESS', payload: clients });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch clients';
      console.error("Error fetching clients:", error);
      dispatch({ type: 'FETCH_CLIENTS_FAILURE', payload: message });
    }
  };

  // クライアント追加
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newClient = await clientService.createClient(clientData);
      dispatch({ type: 'ADD_CLIENT', payload: newClient });
      return newClient;
    } catch (error) {
      console.error("Error adding client:", error);
      const message = error instanceof Error ? error.message : 'Failed to add client';
      throw new Error(message);
    }
  };

  // クライアント更新
  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const updatedClient = await clientService.updateClient(id, clientData);
      dispatch({ type: 'UPDATE_CLIENT', payload: updatedClient });
      return updatedClient;
    } catch (error) {
      console.error("Error updating client:", error);
      const message = error instanceof Error ? error.message : 'Failed to update client';
      throw new Error(message);
    }
  };

  // クライアント削除
  const deleteClient = async (id: string) => {
    try {
      await clientService.deleteClient(id);
      dispatch({ type: 'DELETE_CLIENT', payload: id });
    } catch (error) {
      console.error("Error deleting client:", error);
      const message = error instanceof Error ? error.message : 'Failed to delete client';
      throw new Error(message);
    }
  };

  // 初回マウント時にクライアント一覧を取得
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ClientContext.Provider
      value={{
        ...state,
        fetchClients,
        addClient,
        updateClient,
        deleteClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

// カスタムフック
export const useClients = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
}; 