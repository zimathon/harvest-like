import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// キャッシュインスタンス（無料枠最適化のため積極的にキャッシュ）
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL || '3600'), // デフォルト1時間
  checkperiod: 600, // 10分ごとに期限切れチェック
  useClones: false, // メモリ節約のためクローンを作らない
  deleteOnExpire: true,
  maxKeys: 1000 // 最大1000エントリ
});

// キャッシュ統計
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

/**
 * キャッシュミドルウェア
 * GETリクエストの結果を自動的にキャッシュ
 */
export const cacheMiddleware = (ttl?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // キャッシュが無効の場合はスキップ
    if (process.env.CACHE_ENABLED !== 'true') {
      return next();
    }

    // GETリクエストのみキャッシュ
    if (req.method !== 'GET') {
      return next();
    }

    // キャッシュキーの生成（URL + クエリパラメータ + ユーザーID）
    const userId = (req as any).user?.id || 'anonymous';
    const key = `${userId}:${req.originalUrl || req.url}`;

    // キャッシュから取得を試みる
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      stats.hits++;
      console.log(`Cache HIT: ${key}`);
      return res.json(cachedResponse);
    }

    stats.misses++;
    console.log(`Cache MISS: ${key}`);

    // 元のres.jsonをオーバーライド
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // 成功レスポンスのみキャッシュ
      if (res.statusCode === 200) {
        const cacheTTL = ttl || parseInt(process.env.CACHE_TTL || '3600');
        cache.set(key, data, cacheTTL);
        stats.sets++;
        console.log(`Cache SET: ${key} (TTL: ${cacheTTL}s)`);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * 特定のパターンに一致するキャッシュを無効化
 */
export const invalidateCache = (pattern?: string, userId?: string) => {
  const keys = cache.keys();
  let deletedCount = 0;

  keys.forEach(key => {
    let shouldDelete = false;

    // ユーザーIDでフィルタ
    if (userId && !key.startsWith(`${userId}:`)) {
      return;
    }

    // パターンマッチング
    if (pattern) {
      if (key.includes(pattern)) {
        shouldDelete = true;
      }
    } else if (userId) {
      // パターンが指定されていない場合、ユーザーのすべてのキャッシュを削除
      shouldDelete = true;
    }

    if (shouldDelete) {
      cache.del(key);
      deletedCount++;
      stats.deletes++;
    }
  });

  console.log(`Cache invalidated: ${deletedCount} entries`);
  return deletedCount;
};

/**
 * 特定のエンドポイントに対するキャッシュ無効化ミドルウェア
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // POST, PUT, PATCH, DELETEの場合、関連するキャッシュを無効化
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const userId = (req as any).user?.id;
      
      patterns.forEach(pattern => {
        invalidateCache(pattern, userId);
      });
    }
    next();
  };
};

/**
 * キャッシュ統計を取得
 */
export const getCacheStats = () => {
  const keys = cache.keys();
  const memoryUsage = process.memoryUsage();
  
  return {
    ...stats,
    totalKeys: keys.length,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    memoryUsage: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
    },
    cacheKeys: keys.slice(0, 10) // 最初の10個のキーを表示
  };
};

/**
 * キャッシュをクリア
 */
export const clearCache = () => {
  cache.flushAll();
  console.log('All cache cleared');
};

/**
 * 定期的なキャッシュクリーンアップ
 */
export const startCacheCleanup = () => {
  // 1時間ごとに統計をリセット
  setInterval(() => {
    console.log('Cache stats:', getCacheStats());
    stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }, 3600000);

  // メモリ使用量が閾値を超えたらキャッシュをクリア
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    // Cloud Runの256MBメモリ制限を考慮（200MB以上で警告）
    if (heapUsedMB > 200) {
      console.warn(`High memory usage: ${heapUsedMB.toFixed(2)} MB. Clearing cache...`);
      clearCache();
    }
  }, 60000); // 1分ごとにチェック
};

// 特定のエンドポイント用のキャッシュ設定
export const cacheConfig = {
  // 長期キャッシュ（1日）
  long: cacheMiddleware(86400),
  
  // 中期キャッシュ（1時間）
  medium: cacheMiddleware(3600),
  
  // 短期キャッシュ（5分）
  short: cacheMiddleware(300),
  
  // 超短期キャッシュ（1分）
  tiny: cacheMiddleware(60)
};

export default {
  cacheMiddleware,
  invalidateCache,
  invalidateCacheMiddleware,
  getCacheStats,
  clearCache,
  startCacheCleanup,
  cacheConfig
};