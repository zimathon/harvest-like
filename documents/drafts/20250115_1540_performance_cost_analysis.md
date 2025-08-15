# 本番環境パフォーマンス改善とコスト分析

## 現在の構成（無料枠最適化）

### Cloud Run スペック
- **CPU**: 0.08 vCPU (リクエスト時のみ)
- **メモリ**: 128-256Mi
- **インスタンス**: minScale=0, maxScale=1
- **月間コスト**: **¥0** (無料枠内)

### パフォーマンス問題
1. **コールドスタート**: 3-5秒（毎回発生）
2. **レスポンス時間**: 1-3秒/リクエスト
3. **同時処理**: 不可（1インスタンスのみ）

## 改善案とコスト比較

### 🔹 案1: 最小改善（推奨）
```yaml
CPU: 0.5 vCPU
メモリ: 512Mi  
minScale: 1
maxScale: 3
```

**月間コスト試算**:
- Cloud Run (1インスタンス常時起動): 
  - 0.5 vCPU × 730時間 × $0.024/vCPU時 = **$8.76**
  - 512Mi × 730時間 × $0.0025/GiB時 = **$0.93**
- 追加インスタンス（ピーク時のみ、月10時間想定）: **$0.30**
- **合計: 約¥1,500/月**

**改善効果**:
- ✅ コールドスタート解消
- ✅ レスポンス時間: 200-500ms
- ✅ 同時3リクエスト処理可能

### 🔹 案2: バランス型
```yaml
CPU: 1 vCPU
メモリ: 512Mi
minScale: 1
maxScale: 5
CPU常時割り当て: true
```

**月間コスト試算**:
- Cloud Run (1インスタンス常時起動):
  - 1 vCPU × 730時間 × $0.024/vCPU時 = **$17.52**
  - 512Mi × 730時間 × $0.0025/GiB時 = **$0.93**
- 追加インスタンス（月20時間想定）: **$0.80**
- **合計: 約¥2,900/月**

**改善効果**:
- ✅ 高速レスポンス: 100-300ms
- ✅ バックグラウンド処理可能
- ✅ 同時5リクエスト処理可能

### 🔹 案3: 性能重視
```yaml
CPU: 2 vCPU
メモリ: 1GiB
minScale: 2
maxScale: 10
```

**月間コスト試算**:
- Cloud Run (2インスタンス常時起動):
  - 2 vCPU × 2 × 730時間 × $0.024/vCPU時 = **$70.08**
  - 1GiB × 2 × 730時間 × $0.0025/GiB時 = **$3.65**
- **合計: 約¥11,000/月**

**改善効果**:
- ✅ 超高速レスポンス: 50-150ms
- ✅ 大量同時処理可能
- ✅ エンタープライズ級性能

## Firestore最適化（コスト変わらず）

### 現在の問題
- インデックス未作成の可能性
- N+1クエリパターン
- キャッシュ未使用

### 改善案（追加コスト¥0）
1. **複合インデックス作成**
   ```javascript
   // firestore.indexes.json
   {
     "indexes": [
       {
         "collectionGroup": "timeEntries",
         "fields": [
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "date", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

2. **バッチ読み込み実装**
   ```javascript
   // 改善前: N+1クエリ
   for (const projectId of projectIds) {
     const project = await getProject(projectId);
   }
   
   // 改善後: バッチ読み込み
   const projects = await db.collection('projects')
     .where('__name__', 'in', projectIds)
     .get();
   ```

3. **メモリキャッシュ有効化**
   - 既に環境変数で設定済み（CACHE_ENABLED=true）
   - TTLを調整可能

## 推奨プラン

### 🎯 短期対策（今すぐ実施）
**案1の最小改善** を採用
- コスト: +¥1,500/月
- 効果: 体感速度3-5倍向上
- 実装時間: 5分（gcloudコマンドのみ）

### 実行コマンド
```bash
# Cloud Run設定更新
gcloud run services update harvest-backend \
  --region=asia-northeast1 \
  --cpu=0.5 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=3 \
  --no-cpu-throttling

# Firestore複合インデックス作成
gcloud firestore indexes create \
  --collection-group=timeEntries \
  --field-config field-path=userId,order=ascending \
  --field-config field-path=date,order=descending
```

### 📊 中期対策（1ヶ月後検討）
- Cloud Monitoringでメトリクス収集
- 実際の使用パターンを分析
- 必要に応じて案2へアップグレード

## コスト削減のヒント

1. **時間帯スケーリング**
   - 営業時間: minScale=1
   - 夜間・週末: minScale=0
   - Cloud Schedulerで自動化（無料枠3ジョブ）

2. **リージョン最適化**
   - 現在: asia-northeast1（東京）
   - 代替: asia-northeast2（大阪）やus-central1は若干安い

3. **Committed Use Discounts**
   - 1年契約で約37%割引
   - 月¥3,000以上使うなら検討価値あり

## まとめ

| 項目 | 現在 | 案1（推奨） | 案2 | 案3 |
|------|------|------------|-----|-----|
| 月額コスト | ¥0 | ¥1,500 | ¥2,900 | ¥11,000 |
| コールドスタート | 3-5秒 | なし | なし | なし |
| レスポンス時間 | 1-3秒 | 200-500ms | 100-300ms | 50-150ms |
| 同時処理数 | 1 | 3 | 5 | 10-20 |
| 実装難易度 | - | 簡単 | 簡単 | 簡単 |

**結論**: 月額¥1,500の投資で劇的なパフォーマンス改善が可能。まずは案1を試し、実際の負荷を見てから調整することを推奨。