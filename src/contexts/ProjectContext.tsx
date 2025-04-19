import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Project } from '../types';

// プロジェクト状態の型定義
interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  selectedProject: Project | null;
}

// 初期状態
const initialState: ProjectState = {
  projects: [],
  isLoading: false,
  error: null,
  selectedProject: null
};

// アクション型定義
type ProjectAction = 
  | { type: 'FETCH_PROJECTS_START' }
  | { type: 'FETCH_PROJECTS_SUCCESS'; payload: Project[] }
  | { type: 'FETCH_PROJECTS_FAILURE'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SELECT_PROJECT'; payload: Project | null };

// コンテキストの型定義
interface ProjectContextType extends ProjectState {
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, project: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (project: Project | null) => void;
}

// コンテキストの作成
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Reducer関数
const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
  switch (action.type) {
    case 'FETCH_PROJECTS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_PROJECTS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        projects: action.payload,
        error: null
      };
    case 'FETCH_PROJECTS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload]
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => 
          project.id === action.payload.id ? action.payload : project
        ),
        selectedProject: state.selectedProject?.id === action.payload.id 
          ? action.payload 
          : state.selectedProject
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        selectedProject: state.selectedProject?.id === action.payload 
          ? null 
          : state.selectedProject
      };
    case 'SELECT_PROJECT':
      return {
        ...state,
        selectedProject: action.payload
      };
    default:
      return state;
  }
};

// モックデータ
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    client: 'Acme Inc.',
    description: 'Complete redesign of corporate website',
    status: 'active',
    budget: 10000,
    budgetType: 'fixed',
    createdAt: '2025-03-15T00:00:00Z',
    updatedAt: '2025-04-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Mobile App Development',
    client: 'TechCorp',
    description: 'Develop iOS and Android applications',
    status: 'active',
    budget: 25000,
    budgetType: 'fixed',
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2025-03-25T00:00:00Z'
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    client: 'Global Retail',
    description: 'Q2 digital marketing campaign',
    status: 'on hold',
    budget: 5000,
    budgetType: 'hourly',
    hourlyRate: 150,
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2025-04-05T00:00:00Z'
  }
];

// プロバイダーコンポーネント
export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // プロジェクト一覧取得
  const fetchProjects = async () => {
    dispatch({ type: 'FETCH_PROJECTS_START' });
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ローカルストレージからデータ取得を試みる
      const storedProjects = localStorage.getItem('projects');
      let projects: Project[] = [];
      
      if (storedProjects) {
        projects = JSON.parse(storedProjects);
      } else {
        // 初回はモックデータを使用
        projects = mockProjects;
        localStorage.setItem('projects', JSON.stringify(projects));
      }
      
      dispatch({ type: 'FETCH_PROJECTS_SUCCESS', payload: projects });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_PROJECTS_FAILURE', 
        payload: 'Failed to fetch projects. Please try again.' 
      });
    }
  };

  // プロジェクト追加
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const now = new Date().toISOString();
      const newProject: Project = {
        id: Date.now().toString(),
        ...projectData,
        createdAt: now,
        updatedAt: now
      };
      
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      
      // ローカルストレージを更新
      const storedProjects = localStorage.getItem('projects');
      let projects: Project[] = storedProjects ? JSON.parse(storedProjects) : [];
      projects.push(newProject);
      localStorage.setItem('projects', JSON.stringify(projects));
      
      return newProject;
    } catch (error) {
      throw new Error('Failed to add project');
    }
  };

  // プロジェクト更新
  const updateProject = async (id: string, projectData: Partial<Project>) => {
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 既存プロジェクトを取得
      const storedProjects = localStorage.getItem('projects');
      let projects: Project[] = storedProjects ? JSON.parse(storedProjects) : [];
      const existingProject = projects.find(p => p.id === id);
      
      if (!existingProject) {
        throw new Error('Project not found');
      }
      
      // プロジェクトを更新
      const updatedProject: Project = {
        ...existingProject,
        ...projectData,
        updatedAt: new Date().toISOString()
      };
      
      // ローカルストレージを更新
      const updatedProjects = projects.map(p => 
        p.id === id ? updatedProject : p
      );
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      return updatedProject;
    } catch (error) {
      throw new Error('Failed to update project');
    }
  };

  // プロジェクト削除
  const deleteProject = async (id: string) => {
    try {
      // 実際のアプリケーションではAPIリクエストを行う
      // ここではモック処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ローカルストレージからプロジェクトを削除
      const storedProjects = localStorage.getItem('projects');
      let projects: Project[] = storedProjects ? JSON.parse(storedProjects) : [];
      const updatedProjects = projects.filter(p => p.id !== id);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error) {
      throw new Error('Failed to delete project');
    }
  };

  // プロジェクト選択
  const selectProject = (project: Project | null) => {
    dispatch({ type: 'SELECT_PROJECT', payload: project });
  };

  // 初回マウント時にプロジェクト一覧を取得
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        ...state,
        fetchProjects,
        addProject,
        updateProject,
        deleteProject,
        selectProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

// カスタムフック
export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};