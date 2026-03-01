import * as SQLite from 'expo-sqlite';
import { ClipboardItem, Tag, UserSettings, DEFAULT_SETTINGS } from '../types';

const DB_NAME = 'clipboard_history.db';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS clipboard_items (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'text',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      preview TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#666666',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_clipboard_created_at ON clipboard_items(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_clipboard_category ON clipboard_items(category);
    CREATE INDEX IF NOT EXISTS idx_clipboard_is_pinned ON clipboard_items(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_clipboard_is_favorite ON clipboard_items(is_favorite);
  `);
}

// --- Clipboard Items ---

export async function getAllItems(): Promise<ClipboardItem[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    content: string;
    category: string;
    is_pinned: number;
    is_favorite: number;
    tags: string;
    preview: string;
    created_at: string;
    updated_at: string;
    synced_at: string | null;
  }>('SELECT * FROM clipboard_items ORDER BY is_pinned DESC, created_at DESC');

  return rows.map(rowToItem);
}

export async function searchItems(query: string): Promise<ClipboardItem[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    content: string;
    category: string;
    is_pinned: number;
    is_favorite: number;
    tags: string;
    preview: string;
    created_at: string;
    updated_at: string;
    synced_at: string | null;
  }>(
    'SELECT * FROM clipboard_items WHERE content LIKE ? ORDER BY is_pinned DESC, created_at DESC',
    [`%${query}%`]
  );

  return rows.map(rowToItem);
}

export async function insertItem(item: ClipboardItem): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO clipboard_items (id, content, category, is_pinned, is_favorite, tags, preview, created_at, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.content,
      item.category,
      item.isPinned ? 1 : 0,
      item.isFavorite ? 1 : 0,
      JSON.stringify(item.tags),
      item.preview,
      item.createdAt,
      item.updatedAt,
      item.syncedAt ?? null,
    ]
  );
}

export async function updateItem(item: ClipboardItem): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE clipboard_items SET content = ?, category = ?, is_pinned = ?, is_favorite = ?, tags = ?, preview = ?, updated_at = ?, synced_at = ?
     WHERE id = ?`,
    [
      item.content,
      item.category,
      item.isPinned ? 1 : 0,
      item.isFavorite ? 1 : 0,
      JSON.stringify(item.tags),
      item.preview,
      item.updatedAt,
      item.syncedAt ?? null,
      item.id,
    ]
  );
}

export async function deleteItem(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM clipboard_items WHERE id = ?', [id]);
}

export async function getLatestItem(): Promise<ClipboardItem | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{
    id: string;
    content: string;
    category: string;
    is_pinned: number;
    is_favorite: number;
    tags: string;
    preview: string;
    created_at: string;
    updated_at: string;
    synced_at: string | null;
  }>('SELECT * FROM clipboard_items ORDER BY created_at DESC LIMIT 1');

  return row ? rowToItem(row) : null;
}

export async function getItemCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM clipboard_items'
  );
  return result?.count ?? 0;
}

export async function deleteOldestItems(keepCount: number): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `DELETE FROM clipboard_items WHERE id NOT IN (
       SELECT id FROM clipboard_items WHERE is_pinned = 1
       UNION
       SELECT id FROM clipboard_items ORDER BY created_at DESC LIMIT ?
     )`,
    [keepCount]
  );
}

// --- Tags ---

export async function getAllTags(): Promise<Tag[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    color: string;
    created_at: string;
  }>('SELECT * FROM tags ORDER BY name ASC');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  }));
}

// --- Settings ---

export async function getSettings(): Promise<UserSettings> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    'SELECT * FROM settings'
  );

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const key = row.key as keyof UserSettings;
    if (key in settings) {
      const val = JSON.parse(row.value);
      (settings as Record<string, unknown>)[key] = val;
    }
  }
  return settings;
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, JSON.stringify(value)]
  );
}

// --- Helpers ---

function rowToItem(row: {
  id: string;
  content: string;
  category: string;
  is_pinned: number;
  is_favorite: number;
  tags: string;
  preview: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}): ClipboardItem {
  return {
    id: row.id,
    content: row.content,
    category: row.category as ClipboardItem['category'],
    isPinned: row.is_pinned === 1,
    isFavorite: row.is_favorite === 1,
    tags: JSON.parse(row.tags),
    preview: row.preview,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at ?? undefined,
  };
}
