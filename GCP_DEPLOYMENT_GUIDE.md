# GCP デプロイメントガイド

## 📋 目次
1. [事前準備](#事前準備)
2. [プロジェクトアーキテクチャ](#プロジェクトアーキテクチャ)
3. [初期セットアップ](#初期セットアップ)
4. [Terraformによるインフラ構築](#terraformによるインフラ構築)
5. [アプリケーションのデプロイ](#アプリケーションのデプロイ)
6. [CI/CDパイプライン設定](#cicdパイプライン設定)
7. [監視とログ](#監視とログ)
8. [トラブルシューティング](#トラブルシューティング)

## 事前準備

### 必要なツール
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Terraform](https://www.terraform.io/downloads) (v1.5+)
- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/) (v18+)
- Git

### GCP アカウント設定
```bash
# Google Cloud SDKのインストール確認
gcloud version

# 認証
gcloud auth login

# プロジェクトの作成または選択
gcloud projects create harvest-like-prod --name="Harvest Like Production"
gcloud config set project harvest-like-prod

# 課金アカウントのリンク
gcloud billing accounts list
gcloud billing projects link harvest-like-prod --billing-account=YOUR_BILLING_ACCOUNT_ID

# 必要なAPIの有効化
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  iap.googleapis.com
```

## プロジェクトアーキテクチャ

```
┌─────────────────┐
│   CloudFlare    │
│      (CDN)      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Load Balancer  │
│   (with SSL)    │
└────────┬────────┘
         │
┌────────▼────────┐     ┌──────────────┐
│   Cloud Run     │────▶│   Firestore  │
│   (Backend)     │     │  (Database)  │
└─────────────────┘     └──────────────┘
         │
┌────────▼────────┐     ┌──────────────┐
│   Cloud CDN     │────▶│Cloud Storage │
│   (Frontend)    │     │   (Static)   │
└─────────────────┘     └──────────────┘
```

## 初期セットアップ

### 1. サービスアカウントの作成
```bash
# Terraformサービスアカウント
gcloud iam service-accounts create terraform-sa \
  --display-name="Terraform Service Account"

# Cloud Runサービスアカウント
gcloud iam service-accounts create cloudrun-sa \
  --display-name="Cloud Run Service Account"

# 必要な権限の付与
gcloud projects add-iam-policy-binding harvest-like-prod \
  --member="serviceAccount:terraform-sa@harvest-like-prod.iam.gserviceaccount.com" \
  --role="roles/editor"

gcloud projects add-iam-policy-binding harvest-like-prod \
  --member="serviceAccount:cloudrun-sa@harvest-like-prod.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# サービスアカウントキーの作成
gcloud iam service-accounts keys create \
  ./deploy/terraform/terraform-sa-key.json \
  --iam-account=terraform-sa@harvest-like-prod.iam.gserviceaccount.com
```

### 2. Artifact Registry の設定
```bash
# リポジトリの作成
gcloud artifacts repositories create harvest-like-repo \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Docker repository for Harvest Like"

# Docker認証の設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

## Terraformによるインフラ構築

### 1. Terraform設定ファイルの準備

すべてのTerraformファイルは `deploy/terraform/` ディレクトリに配置します。

### 2. Terraformの初期化と実行
```bash
cd deploy/terraform

# 初期化
terraform init

# 計画の確認
terraform plan

# インフラの構築
terraform apply

# 出力値の確認
terraform output
```

### 3. 作成されるリソース
- Firestore Database (Native Mode)
- Cloud Storage Bucket (Frontend静的ファイル)
- Cloud Run Service (Backend API)
- Load Balancer with SSL
- Cloud CDN
- Secret Manager (環境変数)
- VPC Network (オプション)

## アプリケーションのデプロイ

### 1. バックエンドのデプロイ

```bash
# Dockerイメージのビルド
cd server
docker build -t asia-northeast1-docker.pkg.dev/harvest-like-prod/harvest-like-repo/backend:latest .

# イメージのプッシュ
docker push asia-northeast1-docker.pkg.dev/harvest-like-prod/harvest-like-repo/backend:latest

# Cloud Runへのデプロイ
gcloud run deploy harvest-like-backend \
  --image asia-northeast1-docker.pkg.dev/harvest-like-prod/harvest-like-repo/backend:latest \
  --platform managed \
  --region asia-northeast1 \
  --service-account cloudrun-sa@harvest-like-prod.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="JWT_SECRET=jwt-secret:latest,FIREBASE_CONFIG=firebase-config:latest"
```

### 2. フロントエンドのデプロイ

```bash
# ビルド
npm run build

# Cloud Storageへのアップロード
gsutil -m rsync -r -d dist/ gs://harvest-like-frontend/

# CDNのキャッシュクリア（必要に応じて）
gcloud compute url-maps invalidate-cdn-cache harvest-like-lb \
  --path="/*"
```

### 3. データベースの初期化

```bash
# Firestore インデックスの作成
gcloud firestore indexes create --collection-group=users --field-config field-path=email,order=ASCENDING
gcloud firestore indexes create --collection-group=timeEntries --field-config field-path=userId,order=ASCENDING --field-config field-path=date,order=DESCENDING

# 初期管理者ユーザーの作成
cd server
NODE_ENV=production npm run create-admin:production
```

## CI/CDパイプライン設定

### GitHub Actions ワークフロー

`.github/workflows/deploy.yml` を作成（後述）

### 手動デプロイスクリプト

```bash
# deploy/scripts/deploy-all.sh
#!/bin/bash

echo "🚀 Starting deployment to GCP..."

# バックエンドのデプロイ
./deploy-backend.sh

# フロントエンドのデプロイ
./deploy-frontend.sh

echo "✅ Deployment complete!"
```

## 監視とログ

### 1. Cloud Monitoring の設定
```bash
# アラートポリシーの作成
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-threshold-value=0.01
```

### 2. ログの確認
```bash
# Cloud Runログ
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=harvest-like-backend" --limit 50

# Firestoreログ
gcloud logging read "resource.type=datastore_database" --limit 50
```

### 3. ダッシュボードの作成
GCPコンソールから Cloud Monitoring > ダッシュボード で以下のメトリクスを追加：
- Cloud Run: リクエスト数、レスポンス時間、エラー率
- Firestore: 読み取り/書き込み数、レイテンシ
- Cloud Storage: バンド幅、リクエスト数

## トラブルシューティング

### よくある問題と解決方法

#### 1. Cloud Runがタイムアウトする
```bash
# タイムアウト設定を延長
gcloud run services update harvest-like-backend --timeout=300
```

#### 2. Firestoreの権限エラー
```bash
# サービスアカウントの権限確認
gcloud projects get-iam-policy harvest-like-prod \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:cloudrun-sa@harvest-like-prod.iam.gserviceaccount.com"
```

#### 3. CORSエラー
```bash
# Cloud Runの環境変数を更新
gcloud run services update harvest-like-backend \
  --update-env-vars CORS_ALLOWED_ORIGINS="https://your-domain.com"
```

#### 4. コールドスタート問題
```bash
# 最小インスタンス数の設定
gcloud run services update harvest-like-backend --min-instances=1
```

## セキュリティベストプラクティス

1. **Secret Manager の使用**
   - 環境変数や秘密鍵は必ずSecret Managerで管理

2. **IAP (Identity-Aware Proxy) の有効化**
   - 管理画面へのアクセス制限

3. **VPC Service Controls**
   - Firestoreへのアクセスを制限

4. **Binary Authorization**
   - 承認されたコンテナイメージのみデプロイ可能に

5. **定期的なセキュリティスキャン**
   ```bash
   gcloud container images scan IMAGE_URL
   ```

## コスト最適化

1. **自動スケーリング設定**
   ```bash
   gcloud run services update harvest-like-backend \
     --max-instances=10 \
     --min-instances=0 \
     --concurrency=80
   ```

2. **Firestore使用量の監視**
   - 不要なインデックスの削除
   - クエリの最適化

3. **Cloud CDNの活用**
   - 静的アセットのキャッシュ設定最適化

4. **定期的なリソース見直し**
   ```bash
   # 未使用リソースの確認
   gcloud recommender recommendations list \
     --project=harvest-like-prod \
     --location=global \
     --recommender=google.compute.instance.IdleResourceRecommender
   ```

## 次のステップ

1. **本番環境への移行チェックリスト**
   - [ ] SSL証明書の設定
   - [ ] カスタムドメインの設定
   - [ ] バックアップ戦略の実装
   - [ ] 災害復旧計画の策定
   - [ ] パフォーマンステストの実施
   - [ ] セキュリティ監査の実施

2. **継続的な改善**
   - モニタリングデータの分析
   - ユーザーフィードバックの収集
   - パフォーマンスの最適化