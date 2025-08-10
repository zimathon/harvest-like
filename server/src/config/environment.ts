/**
 * 環境別設定管理
 */

export interface EnvironmentConfig {
  projectId: string;
  databaseURL?: string;
  useEmulator: boolean;
  emulatorHost?: string;
  apiUrl: string;
  frontendUrl: string;
}

const environments: Record<string, EnvironmentConfig> = {
  // ローカル開発環境（Firestore Emulator使用）
  development: {
    projectId: 'harvest-dev-local',
    useEmulator: true,
    emulatorHost: 'localhost:8080',
    apiUrl: 'http://localhost:8080',
    frontendUrl: 'http://localhost:5173'
  },
  
  // ステージング環境（実際のFirestoreを使用）
  staging: {
    projectId: process.env.STAGING_PROJECT_ID || 'harvest-staging',
    databaseURL: process.env.STAGING_DATABASE_URL,
    useEmulator: false,
    apiUrl: process.env.STAGING_API_URL || 'https://harvest-staging.run.app',
    frontendUrl: process.env.STAGING_FRONTEND_URL || 'https://harvest-staging.web.app'
  },
  
  // 本番環境
  production: {
    projectId: process.env.PROJECT_ID || 'harvest-a82c0',
    databaseURL: process.env.DATABASE_URL,
    useEmulator: false,
    apiUrl: process.env.API_URL || 'https://harvest-backend.run.app',
    frontendUrl: process.env.FRONTEND_URL || 'https://harvest-a82c0.web.app'
  }
};

// 現在の環境を取得
export const currentEnvironment = process.env.NODE_ENV || 'development';

// 環境設定を取得
export const config = environments[currentEnvironment];

// Firestore初期化設定を取得
export function getFirestoreConfig() {
  if (config.useEmulator) {
    return {
      projectId: config.projectId,
      host: config.emulatorHost,
      ssl: false
    };
  }
  
  return {
    projectId: config.projectId,
    databaseURL: config.databaseURL
  };
}

// 環境がローカル開発かチェック
export const isDevelopment = () => currentEnvironment === 'development';

// 環境が本番かチェック
export const isProduction = () => currentEnvironment === 'production';

// 環境がステージングかチェック
export const isStaging = () => currentEnvironment === 'staging';

// エミュレータを使用するかチェック
export const useEmulator = () => config.useEmulator;