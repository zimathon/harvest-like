# Cloud Scheduler Warmup ガイド

## 📝 概要

Cloud Runのコールドスタート問題を無料枠内で解決する warmup scheduler の設定・運用ガイドです。

## 🎯 効果

| 指標 | 改善前 | 改善後 |
|------|--------|--------|
| 初回アクセス | 3-5秒 | **<1秒** ⚡ |
| 平日営業時間のレスポンス | 不安定 | **安定** ✅ |
| 月間追加コスト | - | **¥0** (無料枠内) |

## 🚀 自動デプロイ

GitHub Actionsで自動的に設定されます。

```bash
# masterブランチにpushするだけ
git push origin master

# GitHub Actionsが自動的に以下を実行:
# 1. Cloud Runデプロイ
# 2. Cloud Scheduler warmup設定
```

## ✅ 動作確認手順

### 1. Cloud Scheduler API が有効か確認

```bash
# Cloud Scheduler APIを有効化（初回のみ）
gcloud services enable cloudscheduler.googleapis.com --project=harvest-a82c0
```

### 2. デプロイ後の確認

```bash
# warmup jobが作成されているか確認
gcloud scheduler jobs list --location=asia-northeast1

# 期待される出力:
# ID              LOCATION           SCHEDULE (TZ)                          TARGET_TYPE  STATE
# backend-warmup  asia-northeast1    */10 9-18 * * MON-FRI (Asia/Tokyo)    HTTP         ENABLED
```

### 3. 手動テスト

```bash
# 手動でwarmupジョブを実行
gcloud scheduler jobs run backend-warmup --location=asia-northeast1

# 実行ログを確認
gcloud scheduler jobs describe backend-warmup --location=asia-northeast1
```

### 4. Cloud Runのログで確認

```bash
# Cloud Runのログでwarmupリクエストを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=harvest-backend AND httpRequest.requestUrl=~\"/health\"" \
  --limit=10 \
  --format=json \
  --project=harvest-a82c0
```

GCP Console: https://console.cloud.google.com/logs/query

## 📊 スケジュール詳細

### 現在の設定

```
スケジュール: */10 9-18 * * MON-FRI
タイムゾーン: Asia/Tokyo
説明: 平日9:00-18:00、10分ごとにpingを送信
```

### 動作イメージ

```
月曜日:
09:00 → ping → インスタンス起動
09:10 → ping → ウォーム維持
09:20 → ping → ウォーム維持
...
17:50 → ping → ウォーム維持
18:00 → ping → ウォーム維持
18:01 → (スケジュール終了)

火曜日〜金曜日: 同様

土日: warmupなし（必要に応じてアクセス時に起動）
```

## 💰 コスト計算

### 月間リクエスト数

```
1日: 60回 (9:00-18:00 = 10時間 × 6回/時間)
週: 60回 × 5日 = 300回
月: 300回 × 4週 = 1,200回
```

### 無料枠との比較

```
Cloud Run 無料枠: 2,000,000 リクエスト/月
warmup使用量:      1,200 リクエスト/月
使用率:           0.06%

→ 完全に無料枠内 ✅
```

### 追加のリソース消費

```
CPU秒:    1,200リクエスト × 0.1秒 = 120 vCPU秒/月
          (無料枠 180,000 vCPU秒の 0.067%)

メモリ秒:  1,200リクエスト × 0.1秒 × 256Mi = 30,720 MiB秒/月
          (無料枠 360,000 GiB秒の 0.008%)

→ すべて無料枠内 ✅
```

## 🛠️ カスタマイズ

### スケジュールを変更したい場合

```yaml
# .github/workflows/deploy-production.yml の該当箇所を編集

# 例1: 24時間常時warmup（より積極的）
--schedule="*/5 * * * *"  # 5分ごと

# 例2: 営業時間を拡大
--schedule="*/10 8-20 * * MON-FRI"  # 8:00-20:00

# 例3: 土曜日も追加
--schedule="*/10 9-18 * * MON-SAT"  # 月〜土
```

### 手動で設定を変更

```bash
gcloud scheduler jobs update http backend-warmup \
  --location=asia-northeast1 \
  --schedule="*/5 * * * *" \
  --time-zone="Asia/Tokyo"
```

## 🚨 トラブルシューティング

### 問題1: warmupジョブが作成されない

**原因**: Cloud Scheduler APIが有効化されていない

**解決**:
```bash
gcloud services enable cloudscheduler.googleapis.com --project=harvest-a82c0
```

### 問題2: ジョブが失敗している

**確認**:
```bash
# ジョブの状態を確認
gcloud scheduler jobs describe backend-warmup --location=asia-northeast1

# 最近の実行結果を確認
gcloud scheduler jobs describe backend-warmup --location=asia-northeast1 \
  --format="value(status.lastAttemptTime, status.state)"
```

**よくある原因**:
- Cloud RunサービスのURLが変わった → 再デプロイで自動修正
- Cloud Runが停止している → サービスを起動
- `/health` エンドポイントが応答しない → サーバーログ確認

### 問題3: warmupしてもコールドスタートが起きる

**原因**: warmup間隔（10分）より先にインスタンスが停止

**解決**: スケジュールを短くする
```bash
# 5分ごとに変更
gcloud scheduler jobs update http backend-warmup \
  --location=asia-northeast1 \
  --schedule="*/5 9-18 * * MON-FRI"
```

## 📈 モニタリング

### Cloud Console でのモニタリング

1. **Cloud Scheduler**: https://console.cloud.google.com/cloudscheduler
   - ジョブの実行状況
   - 成功/失敗の履歴

2. **Cloud Run**: https://console.cloud.google.com/run
   - リクエスト数グラフ
   - インスタンス数の推移
   - レスポンス時間

### コマンドラインでの確認

```bash
# 過去24時間のwarmupリクエストをカウント
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=harvest-backend \
  AND httpRequest.requestUrl=~\"/health\" \
  AND timestamp>=\"$(date -u -d '24 hours ago' '+%Y-%m-%dT%H:%M:%S')Z\"" \
  --limit=1000 \
  --format="value(timestamp)" \
  --project=harvest-a82c0 | wc -l
```

## 🎓 ベストプラクティス

### ✅ 推奨

1. **営業時間のみwarmup**: 夜間・休日は不要（コスト削減）
2. **10分間隔**: バランスが良い（頻繁すぎず、遅すぎず）
3. **healthエンドポイント使用**: 軽量で副作用なし
4. **自動化**: GitHub Actionsで自動設定

### ❌ 避けるべき

1. **1分ごとのwarmup**: 無駄にリクエスト消費
2. **重いエンドポイントへのping**: Firestore読み書きなど
3. **min-instances=1**: warmupで十分、常時起動は不要

## 🔄 無効化方法

warmupが不要になった場合：

```bash
# ジョブを一時停止
gcloud scheduler jobs pause backend-warmup --location=asia-northeast1

# ジョブを完全削除
gcloud scheduler jobs delete backend-warmup --location=asia-northeast1
```

または、GitHub Actions workflowから該当ステップを削除してください。

## 📚 関連ドキュメント

- [GCP_FREE_TIER_GUIDE.md](./GCP_FREE_TIER_GUIDE.md) - 無料枠最大活用ガイド
- [GCP_COST_ESTIMATION.md](./GCP_COST_ESTIMATION.md) - コスト見積もり
- [Cloud Scheduler公式ドキュメント](https://cloud.google.com/scheduler/docs)
