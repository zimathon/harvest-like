import { create } from 'zustand';
import { ClipboardItem, FilterType } from '../types';
import * as storageService from '../services/storageService';
import * as clipboardService from '../services/clipboardService';

interface ClipboardState {
  items: ClipboardItem[];
  isLoading: boolean;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  loadItems: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  copyItem: (id: string) => Promise<void>;
  searchItems: (query: string) => Promise<void>;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  isLoading: false,
  filter: 'all',

  setFilter: (filter: FilterType) => {
    set({ filter });
  },

  loadItems: async () => {
    set({ isLoading: true });
    try {
      const items = await storageService.getAllItems();
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Failed to load items:', error);
      set({ isLoading: false });
    }
  },

  deleteItem: async (id: string) => {
    await storageService.deleteItem(id);
    set({ items: get().items.filter((item) => item.id !== id) });
  },

  togglePin: async (id: string) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const updated = {
      ...item,
      isPinned: !item.isPinned,
      updatedAt: new Date().toISOString(),
    };
    await storageService.updateItem(updated);
    set({
      items: get().items.map((i) => (i.id === id ? updated : i)),
    });
  },

  toggleFavorite: async (id: string) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const updated = {
      ...item,
      isFavorite: !item.isFavorite,
      updatedAt: new Date().toISOString(),
    };
    await storageService.updateItem(updated);
    set({
      items: get().items.map((i) => (i.id === id ? updated : i)),
    });
  },

  copyItem: async (id: string) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    await clipboardService.copyToClipboard(item.content);
  },

  searchItems: async (query: string) => {
    set({ isLoading: true });
    try {
      const items = query.trim()
        ? await storageService.searchItems(query)
        : await storageService.getAllItems();
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Failed to search items:', error);
      set({ isLoading: false });
    }
  },
}));
