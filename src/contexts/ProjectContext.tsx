import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import * as projectService from '../services/projectService.js';
import { Project } from '../types/index.js';
import { useAuth } from './AuthContext.js'; // useAuthフックをインポート

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
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'client'> & { client: string }) => Promise<Project>;
  updateProject: (id: string, project: Partial<Omit<Project, 'client'>> & { client?: string }) => Promise<Project>;
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
          (project._id || project.id) === (action.payload._id || action.payload.id) ? action.payload : project
        ),
        selectedProject: (state.selectedProject?._id || state.selectedProject?.id) === (action.payload._id || action.payload.id)
          ? action.payload 
          : state.selectedProject
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => (project._id || project.id) !== action.payload),
        selectedProject: (state.selectedProject?._id || state.selectedProject?.id) === action.payload 
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

// モックデータの定義を削除 (以前の修正でコメントアウト済みのはず)
/*
const mockProjects: Project[] = [ ... ];
*/

// プロバイダーコンポーネント
export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { isAuthenticated } = useAuth(); // AuthContextから認証状態を取得

  // プロジェクト一覧取得 (API呼び出しに変更)
  const fetchProjects = async () => {
    dispatch({ type: 'FETCH_PROJECTS_START' });
    try {
      // --- APIを使用してプロジェクト一覧を取得 ---
      const projects = await projectService.getProjects();
      dispatch({ type: 'FETCH_PROJECTS_SUCCESS', payload: projects });
      // --- ローカルストレージとモックデータのロジックは削除 ---
      /*
      const storedProjects = localStorage.getItem('projects');
      // ... (localStorage logic removed) ...
      */
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      console.error("Error fetching projects:", error);
      dispatch({
        type: 'FETCH_PROJECTS_FAILURE',
        // payload: 'Failed to fetch projects. Please try again.'
        payload: message // より具体的なエラーメッセージをセット
      });
    }
  };

  // プロジェクト追加 (エラーハンドリング改善)
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'client'> & { client: string }) => {
    // optimistic update: 先にUIに反映 (任意)
    // const tempId = Date.now().toString(); // 仮ID
    // dispatch({ type: 'ADD_PROJECT', payload: { ...projectData, id: tempId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });

    try {
      const newProject = await projectService.createProject(projectData as any); // APIはclient IDを期待
      // API成功後に正しいデータで状態を更新 (optimistic updateの場合は不要 or ID置換)
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    } catch (error) {
      console.error("Error adding project:", error);
      // optimistic update をしていた場合はロールバック処理が必要
      // dispatch({ type: 'DELETE_PROJECT', payload: tempId }); // 例: 仮IDで追加したものを削除
      const message = error instanceof Error ? error.message : 'Failed to add project';
      throw new Error(message); // エラーを再スローして呼び出し元で処理できるようにする
    }
  };

  // プロジェクト更新 (エラーハンドリング改善)
  const updateProject = async (id: string, projectData: Partial<Omit<Project, 'client'>> & { client?: string }) => {
    // const originalProject = state.projects.find(p => p.id === id); // optimistic update用
    // if (originalProject) {
    //   dispatch({ type: 'UPDATE_PROJECT', payload: { ...originalProject, ...projectData } });
    // }

    try {
      const updatedProject = await projectService.updateProject(id, projectData as any); // APIはclient IDを期待
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      // if (originalProject) { // optimistic update のロールバック
      //   dispatch({ type: 'UPDATE_PROJECT', payload: originalProject });
      // }
      const message = error instanceof Error ? error.message : 'Failed to update project';
      throw new Error(message);
    }
  };

  // プロジェクト削除 (エラーハンドリング改善)
  const deleteProject = async (id: string) => {
    // const originalProjects = [...state.projects]; // optimistic update用
    // dispatch({ type: 'DELETE_PROJECT', payload: id });

    try {
      await projectService.deleteProject(id);
      // API 成功後に state を更新 (optimistic update の場合は不要)
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error) {
      console.error("Error deleting project:", error);
      // dispatch({ type: 'FETCH_PROJECTS_SUCCESS', payload: originalProjects }); // optimistic update のロールバック例
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      throw new Error(message);
    }
  };

  // プロジェクト選択 (変更なし)
  const selectProject = (project: Project | null) => {
    dispatch({ type: 'SELECT_PROJECT', payload: project });
  };

  // 初回マウント時、または認証状態が変化したときにプロジェクト一覧を取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
    throw new Error('useProjects must be used within an ProjectProvider');
  }
  return context;
};