// クリップボードアイテムのカテゴリ
export type ClipboardCategory = 'text' | 'url' | 'email' | 'phone' | 'code' | 'other';

// クリップボードアイテム
export interface ClipboardItem {
  id: string;
  content: string;
  category: ClipboardCategory;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  preview: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

// タグ
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

// ユーザー設定
export interface UserSettings {
  maxHistoryItems: number;
  autoDetectCategory: boolean;
  cloudSyncEnabled: boolean;
  duplicateDetection: boolean;
  theme: 'light' | 'dark' | 'system';
}

// デフォルト設定
export const DEFAULT_SETTINGS: UserSettings = {
  maxHistoryItems: 500,
  autoDetectCategory: true,
  cloudSyncEnabled: false,
  duplicateDetection: true,
  theme: 'system',
};

// フィルターオプション
export type FilterType = 'all' | 'pinned' | 'favorite' | ClipboardCategory;
