import { create } from 'zustand';
import { UserSettings, DEFAULT_SETTINGS } from '../types';
import * as storageService from '../services/storageService';

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await storageService.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  updateSetting: async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    await storageService.saveSetting(key, value);
    set({
      settings: { ...get().settings, [key]: value },
    });
  },
}));
