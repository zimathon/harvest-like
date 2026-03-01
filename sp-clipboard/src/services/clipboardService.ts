import * as Clipboard from 'expo-clipboard';
import { AppState, AppStateStatus } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { ClipboardItem } from '../types';
import { detectCategory, generatePreview } from './categoryDetector';
import * as storageService from './storageService';

type ClipboardCallback = (item: ClipboardItem) => void;

let lastContent: string | null = null;
let listeners: ClipboardCallback[] = [];
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

export function addListener(callback: ClipboardCallback): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notifyListeners(item: ClipboardItem): void {
  listeners.forEach((cb) => cb(item));
}

export async function captureClipboard(
  duplicateDetection: boolean
): Promise<ClipboardItem | null> {
  try {
    const hasString = await Clipboard.hasStringAsync();
    if (!hasString) return null;

    const content = await Clipboard.getStringAsync();
    if (!content || content.trim() === '') return null;

    // Skip if same as last captured
    if (content === lastContent) return null;
    lastContent = content;

    // Duplicate detection
    if (duplicateDetection) {
      const latest = await storageService.getLatestItem();
      if (latest && latest.content === content) return null;
    }

    const now = new Date().toISOString();
    const item: ClipboardItem = {
      id: uuidv4(),
      content,
      category: detectCategory(content),
      isPinned: false,
      isFavorite: false,
      tags: [],
      preview: generatePreview(content),
      createdAt: now,
      updatedAt: now,
    };

    await storageService.insertItem(item);
    notifyListeners(item);
    return item;
  } catch (error) {
    console.warn('Clipboard capture failed:', error);
    return null;
  }
}

export async function copyToClipboard(content: string): Promise<void> {
  await Clipboard.setStringAsync(content);
  lastContent = content; // Prevent re-capture of what we just copied
}

export function startMonitoring(duplicateDetection: boolean): void {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener(
    'change',
    async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        await captureClipboard(duplicateDetection);
      }
    }
  );

  // Initial capture
  captureClipboard(duplicateDetection);
}

export function stopMonitoring(): void {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
