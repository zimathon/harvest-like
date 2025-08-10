# GCP 無料枠最大活用ガイド - Harvest Like

## 🎯 目標: 月額 ¥0〜¥1,000 での運用

本ガイドでは、GCPの無料枠を最大限活用し、実質無料または最小限のコストでHarvest Likeを運用する方法を説明します。

## 📊 完全無料構成（月額 ¥0）

### 1. Firebase Hosting（フロントエンド）
**完全無料枠:**
- 10GB ストレージ
- 360MB/日の転送量
- カスタムドメイン対応
- SSL証明書無料

```bash
# Cloud Storageの代わりにFirebase Hostingを使用
firebase init hosting
firebase deploy --only hosting
```

### 2. Cloud Run（バックエンド）
**無料枠を超えない設定:**
```yaml
# 無料枠内の設定
設定:
  最小インスタンス: 0  # 常時起動しない
  最大インスタンス: 1  # スケールアウトしない
  メモリ: 256Mi        # 最小限のメモリ
  CPU: 1
  タイムアウト: 60秒
```

**月間無料枠:**
- 200万リクエスト
- 360,000 GB-秒のメモリ
- 180,000 vCPU-秒

**コスト削減の実装:**
```typescript
// server/src/config/cache.ts
import NodeCache from 'node-cache';

// 積極的なキャッシュでFirestore読み取りを削減
export const cache = new NodeCache({
  stdTTL: 3600,      // 1時間のキャッシュ
  checkperiod: 600,  // 10分ごとにチェック
  useClones: false   // メモリ節約
});

// キャッシュミドルウェア
export const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);
  
  if (cached) {
    return res.json(cached);
  }
  
  const originalJson = res.json;
  res.json = function(data) {
    cache.set(key, data);
    originalJson.call(this, data);
  };
  
  next();
};
```

### 3. Firestore（データベース）
**無料枠:**
- 1GB ストレージ
- 50,000 読み取り/日
- 20,000 書き込み/日
- 20,000 削除/日

**最適化戦略:**
```typescript
// server/src/utils/firestore-optimizer.ts

// バッチ処理で書き込み削減
export const batchWrite = async (operations: any[]) => {
  const batch = db.batch();
  operations.forEach(op => {
    batch.set(op.ref, op.data);
  });
  await batch.commit(); // 1回の書き込みとしてカウント
};

// ページネーション実装
export const getPaginatedData = async (
  collection: string,
  limit: number = 10,
  lastDoc?: any
) => {
  let query = db.collection(collection)
    .orderBy('createdAt', 'desc')
    .limit(limit);
    
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  return query.get();
};

// 必要なフィールドのみ取得
export const getPartialDocument = async (
  collection: string,
  docId: string,
  fields: string[]
) => {
  const doc = await db.collection(collection)
    .doc(docId)
    .select(...fields)
    .get();
  return doc.data();
};
```

## 🚀 超低コスト構成（月額 ¥500〜¥1,000）

### Terraform 設定の変更
```hcl
# deploy/terraform/free-tier.tf

# Cloud Runの最小構成
resource "google_cloud_run_service" "backend" {
  name     = "harvest-backend"
  location = var.region

  template {
    spec {
      containers {
        image = var.backend_image
        
        # メモリを最小限に
        resources {
          limits = {
            memory = "256Mi"
            cpu    = "1"
          }
        }
        
        # ヘルスチェック間隔を長く
        liveness_probe {
          initial_delay_seconds = 30
          period_seconds        = 60  # 1分ごと
        }
      }
    }
    
    metadata {
      annotations = {
        # 最小インスタンス0でコールドスタートを許容
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "1"
        
        # CPU使用率の閾値を高く設定
        "autoscaling.knative.dev/target" = "90"
      }
    }
  }
}

# Firestoreインデックスの最小化
resource "google_firestore_index" "minimal_indexes" {
  # 複合インデックスは必要最小限のみ
  # 単一フィールドインデックスは自動作成されるものを使用
  
  collection = "timeEntries"
  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }
  fields {
    field_path = "date"
    order      = "DESCENDING"
  }
}
```

### Cloud Scheduler でウォームアップ
```hcl
# 無料枠: 3つのジョブまで無料
resource "google_cloud_scheduler_job" "warmup" {
  name             = "backend-warmup"
  description      = "Keep backend warm during business hours"
  schedule         = "*/15 9-18 * * MON-FRI"  # 平日9-18時、15分ごと
  time_zone        = "Asia/Tokyo"
  attempt_deadline = "30s"

  http_target {
    http_method = "GET"
    uri         = "${google_cloud_run_service.backend.status[0].url}/health"
  }
}
```

## 💡 コスト削減テクニック

### 1. クライアントサイドキャッシュの活用
```typescript
// src/services/cacheService.ts
class CacheService {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5分

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl
    });
    
    return data;
  }
  
  invalidate(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const cacheService = new CacheService();
```

### 2. Firestore Lite の使用（読み取り専用）
```typescript
// src/services/firestore-lite.ts
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore/lite';

// Lite版は軽量で、リアルタイム更新なし
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 読み取り専用の軽量実装
export const getReports = async (userId: string) => {
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', userId),
    limit(10)  // 必ず制限をかける
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### 3. 静的ファイルの最適化
```json
// package.json
{
  "scripts": {
    "build:optimize": "npm run build && npm run optimize",
    "optimize": "npm run optimize:images && npm run optimize:bundle",
    "optimize:images": "imagemin dist/assets/images/* --out-dir=dist/assets/images",
    "optimize:bundle": "terser dist/assets/js/*.js -o dist/assets/js/[name].min.js"
  }
}
```

### 4. バックグラウンドジョブの最適化
```typescript
// server/src/jobs/cleanup.ts
import { pubsub } from '@google-cloud/pubsub';

// Cloud Functionsの代わりにPub/Sub + Cloud Runを使用
export const scheduleCleanup = async () => {
  // 無料枠: 10GB/月のPub/Subメッセージ
  const topic = pubsub.topic('cleanup-tasks');
  
  // バッチ処理でメッセージ数を削減
  const tasks = await collectCleanupTasks();
  const batches = chunk(tasks, 100);
  
  for (const batch of batches) {
    await topic.publish(Buffer.from(JSON.stringify(batch)));
  }
};
```

## 📈 モニタリング（無料）

### Cloud Monitoring 基本メトリクス
```yaml
# 無料で監視できるメトリクス
- Cloud Run リクエスト数
- Cloud Run レスポンス時間
- Firestore 読み書き回数
- エラー率
```

### 予算アラートの設定
```bash
# 月額1000円でアラート
gcloud billing budgets create \
  --billing-account=$BILLING_ACCOUNT_ID \
  --display-name="Free Tier Alert" \
  --budget-amount=1000JPY \
  --threshold-rule=percent=50,color=yellow \
  --threshold-rule=percent=80,color=orange \
  --threshold-rule=percent=100,color=red
```

## 🎓 無料枠を超えないための運用ルール

### 1. 日次制限の実装
```typescript
// server/src/middleware/rateLimiter.ts
const dailyLimits = {
  firestoreReads: 45000,   // 無料枠の90%
  firestoreWrites: 18000,  // 無料枠の90%
  apiRequests: 1800000     // 無料枠の90%
};

export const checkDailyLimits = async (req, res, next) => {
  const today = new Date().toISOString().split('T')[0];
  const usage = await getUsage(today);
  
  if (usage.firestoreReads >= dailyLimits.firestoreReads) {
    return res.status(429).json({
      error: 'Daily Firestore read limit reached',
      resetAt: getTomorrowMidnight()
    });
  }
  
  next();
};
```

### 2. ユーザー制限
```typescript
// 無料プランでのユーザー数制限
const MAX_FREE_USERS = 50;

export const checkUserLimit = async () => {
  const userCount = await db.collection('users').count().get();
  
  if (userCount.data().count >= MAX_FREE_USERS) {
    throw new Error('User limit reached for free tier');
  }
};
```

## 🚨 コスト超過防止策

### 自動シャットダウンスクリプト
```bash
#!/bin/bash
# deploy/scripts/cost-guard.sh

BUDGET_THRESHOLD=1000  # 1000円
CURRENT_COST=$(gcloud billing accounts get-iam-policy $BILLING_ACCOUNT_ID \
  --format="value(cost.amount)")

if [ $(echo "$CURRENT_COST > $BUDGET_THRESHOLD" | bc) -eq 1 ]; then
  echo "⚠️ Budget threshold exceeded! Scaling down..."
  
  # Cloud Runを0インスタンスに
  gcloud run services update harvest-backend \
    --min-instances=0 \
    --max-instances=1 \
    --region=asia-northeast1
  
  # アラート送信
  curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d '{"text":"🚨 GCP budget exceeded! Services scaled down."}'
fi
```

## 📊 実際の運用例

### 完全無料で運用可能なケース
- ユーザー数: 〜20人
- 1日のアクティブユーザー: 〜10人
- データ量: 〜500MB
- 月間リクエスト: 〜10万

### 月額¥500程度のケース
- ユーザー数: 〜50人
- 1日のアクティブユーザー: 〜30人
- データ量: 〜1GB
- 月間リクエスト: 〜50万

## 🎯 まとめ

**完全無料化のポイント:**
1. Firebase Hostingでフロントエンド配信
2. Cloud Run最小インスタンス0
3. 積極的なキャッシュ活用
4. Firestore読み書きの最適化
5. 必要最小限のインデックス

**注意事項:**
- パフォーマンスと無料枠はトレードオフ
- ユーザー体験を損なわない範囲で最適化
- 成長したら段階的に有料プランへ移行

この構成により、小規模なチームや個人プロジェクトでは**実質無料**でHarvest Likeを運用できます。