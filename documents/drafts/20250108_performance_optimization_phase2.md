# Phase 2: ウォーム時のパフォーマンス改善案

**作成日**: 2025-01-08
**ステータス**: Phase 1の効果確認後に実装検討

## 📊 現状分析

Phase 1実装後の想定状況：
- ✅ コールドスタート: 3-5秒 → **<1秒** に改善
- ⚠️ ウォーム時: まだ最適化の余地あり

## 🎯 Phase 2の目標

ウォーム時のレスポンスを **<300ms** に改善

## 🔍 調査すべきポイント

### 1. どのエンドポイントが遅いか特定

```bash
# Cloud Runログで各エンドポイントのレスポンス時間を確認
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=harvest-backend \
  AND httpRequest.latency>\"1s\"" \
  --limit=50 \
  --format="table(httpRequest.requestUrl, httpRequest.latency)" \
  --project=harvest-a82c0
```

### 2. Firestoreクエリのボトルネック確認

```typescript
// 各エンドポイントに計測を追加（一時的）
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {  // 500ms以上かかった場合ログ
      console.log(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});
```

## 💡 最適化案（優先度順）

### 【優先度：高】簡単に実装できて効果が大きい

#### 1. メモリキャッシュの実装

**対象**: よく読み取られる静的データ（ユーザー情報、プロジェクト一覧など）

```typescript
// server/src/utils/cache.ts
import NodeCache from 'node-cache';

// 短期キャッシュ（5分）
export const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false  // メモリ節約
});

// キャッシュミドルウェア
export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      cache.set(key, data, duration);
      return originalJson(data);
    };

    next();
  };
};
```

**使用例**:
```typescript
// よく読まれるエンドポイントに適用
app.get('/api/v2/projects', cacheMiddleware(300), projectsController.list);
```

**効果**: Firestore読み取り回数を50-80%削減

#### 2. クエリ結果の制限（ページネーション）

**現状確認が必要**: 大量データを一度に取得していないか？

```typescript
// 悪い例（全データ取得）
const allEntries = await db.collection('timeEntries').get();

// 良い例（ページネーション）
const entries = await db.collection('timeEntries')
  .orderBy('date', 'desc')
  .limit(50)  // 必ず制限
  .get();
```

**効果**: 大量データがある場合、レスポンス時間を70-90%削減

#### 3. 必要なフィールドのみ取得

```typescript
// 悪い例（全フィールド取得）
const user = await db.collection('users').doc(userId).get();

// 良い例（必要なフィールドのみ）
const user = await db.collection('users')
  .doc(userId)
  .select('id', 'email', 'name')  // 必要なフィールドのみ
  .get();
```

**効果**: ネットワーク転送量削減、レスポンス時間5-10%改善

### 【優先度：中】効果的だが実装に工数がかかる

#### 4. バッチ処理の活用

複数ドキュメントの読み取りを1回のリクエストにまとめる：

```typescript
// 悪い例（N+1問題）
for (const projectId of projectIds) {
  const project = await db.collection('projects').doc(projectId).get();
  projects.push(project.data());
}

// 良い例（バッチ読み取り）
const projectRefs = projectIds.map(id =>
  db.collection('projects').doc(id)
);
const projects = await db.getAll(...projectRefs);
```

**効果**: 複数回のネットワークラウンドトリップを削減

#### 5. Firestore複合インデックスの最適化

**確認**: 現在のクエリに適切なインデックスがあるか？

```bash
# クエリが遅い場合、Firestoreコンソールでインデックス作成を提案される
# 必要なインデックスを追加
```

### 【優先度：低】大規模になったら検討

#### 6. Redis キャッシュの導入

**注意**: GCP Memorystore（Redis）は有料

現状は Node-cache で十分。ユーザー数が100人以上になったら検討。

## 📊 実装の進め方

### Step 1: 計測
```typescript
// 各エンドポイントにパフォーマンス計測を追加
// 遅いエンドポイントを特定
```

### Step 2: 優先度決定
```
遅いエンドポイント × 使用頻度 = 優先度
```

### Step 3: 段階的実装
```
1週目: キャッシュ実装（最も使用頻度の高いエンドポイント）
2週目: ページネーション追加
3週目: バッチ処理最適化
```

### Step 4: 効果測定
```
改善前後のレスポンス時間を記録
無料枠の消費量も確認
```

## 🚨 注意事項

### キャッシュ無効化の実装

データ更新時はキャッシュをクリア：

```typescript
// データ更新時
await db.collection('projects').doc(id).update(data);

// キャッシュクリア
cache.del(`/api/v2/projects/${id}`);
cache.del('/api/v2/projects');  // 一覧もクリア
```

### 無料枠への影響

- ✅ キャッシュ: Firestore読み取り削減 → **コスト削減**
- ✅ ページネーション: 読み取り量削減 → **コスト削減**
- ⚠️ メモリキャッシュ: メモリ使用量増加 → 256Mi で問題なければOK

## 📈 期待される効果

| 施策 | レスポンス改善 | Firestore削減 |
|------|----------------|---------------|
| キャッシュ | 50-70% | 50-80% |
| ページネーション | 30-50% | 60-90% |
| バッチ処理 | 20-40% | - |
| **合計** | **<300ms目標** | **無料枠内維持** |

## 🎯 次のアクション

Phase 1の効果確認後：

1. **計測**: Cloud Runログで遅いエンドポイントを特定
2. **相談**: 遅いエンドポイントを共有 → 最適化案を具体化
3. **実装**: 優先度の高いものから段階的に実装
