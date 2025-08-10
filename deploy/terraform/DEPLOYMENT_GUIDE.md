# 🚀 Harvest Like デプロイメントガイド（完全版）

## 📋 目次
1. [前提条件](#前提条件)
2. [環境構成](#環境構成)
3. [初回セットアップ](#初回セットアップ)
4. [Terraformデプロイ](#terraformデプロイ)
5. [アプリケーションデプロイ](#アプリケーションデプロイ)
6. [環境別設定](#環境別設定)
7. [トラブルシューティング](#トラブルシューティング)
8. [コスト管理](#コスト管理)

## 前提条件

### 必要なツールのインストール

```bash
# 1. Terraform (v1.0以上)
brew install terraform

# 2. Google Cloud SDK
brew install google-cloud-sdk

# 3. Firebase CLI
npm install -g firebase-tools

# 4. Docker Desktop
brew install --cask docker

# 5. Node.js (v18以上)
brew install node
```

### 認証設定

```bash
# GCP認証
gcloud auth login
gcloud auth application-default login

# Firebase認証
firebase login
```

## 環境構成

### 3つの環境構成

| 環境 | 用途 | データソース | コスト |
|------|------|------------|--------|
| **開発** | ローカル開発 | Firestore Emulator | ¥0 |
| **ステージング** | 本番前テスト | GCP Firestore (別プロジェクト) | ¥0-500/月 |
| **本番** | 実運用 | GCP Firestore (harvest-a82c0) | ¥0-1,000/月 |

## 初回セットアップ

### 1. GCPプロジェクトの準備

```bash
# プロジェクトIDを設定（既存: harvest-a82c0）
export PROJECT_ID="harvest-a82c0"

# 既存プロジェクトを使用する場合
gcloud config set project $PROJECT_ID

# 新規プロジェクトを作成する場合
# gcloud projects create $PROJECT_ID --name="Harvest Like"

# 請求先アカウントのリンク（必須）
gcloud beta billing accounts list
gcloud beta billing projects link $PROJECT_ID \
  --billing-account=017831-B01AF3-3A53DC
```

### 2. 必要なAPIの有効化

```bash
# 一括で有効化
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudbilling.googleapis.com \
  billingbudgets.googleapis.com \
  cloudfunctions.googleapis.com \
  pubsub.googleapis.com \
  --project=$PROJECT_ID
```

### 3. Terraform状態管理用バケット作成

```bash
# 状態管理用バケット（一度だけ実行）
gsutil mb -p $PROJECT_ID -l asia-northeast1 \
  gs://${PROJECT_ID}-terraform-state

# バージョニング有効化
gsutil versioning set on gs://${PROJECT_ID}-terraform-state
```

## Terraformデプロイ

### 1. 設定ファイルの準備

```bash
cd deploy/terraform

# 設定ファイルをコピー
cp terraform.tfvars.example terraform.tfvars

# JWT Secretの生成
echo "jwt_secret = \"$(openssl rand -base64 32)\"" >> terraform.tfvars
```

**terraform.tfvars の編集:**
```hcl
# 必須項目
project_id      = "harvest-a82c0"
billing_account = "017831-B01AF3-3A53DC"
jwt_secret      = "生成されたJWTシークレット"

# フロントエンドURL（Firebase Hosting）
frontend_url    = "https://harvest-a82c0.web.app"

# 無料枠モード（デフォルト: true）
enable_free_tier = true
```

### 2. Firestore既存データベースの処理

既存のFirestoreデータベースがある場合、Terraformにインポート：

```bash
# 既存データベースを確認
gcloud firestore databases list --project=$PROJECT_ID

# 既存の場合はインポート（オプション）
terraform import google_firestore_database.main_free[0] \
  "projects/${PROJECT_ID}/databases/(default)"
```

### 3. Terraformデプロイ実行

```bash
# 初期化
terraform init -backend-config="bucket=${PROJECT_ID}-terraform-state"

# プラン確認
terraform plan

# デプロイ実行
terraform apply -auto-approve

# 出力確認
terraform output -json > deployment_output.json
```

### 4. Firebase設定ファイルの確認

Terraformが自動生成したFirebase設定：

```bash
# firebase.json と .firebaserc が作成されているか確認
ls -la ../../firebase.json ../../.firebaserc
```

## アプリケーションデプロイ

### 1. バックエンド（Cloud Run）

#### Dockerイメージのビルドとプッシュ

```bash
cd ../../server

# Artifact Registry認証設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# 方法1: Cloud Build使用（推奨）
gcloud builds submit \
  --tag asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest \
  --project=$PROJECT_ID

# 方法2: ローカルビルド
docker build -t asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest .
docker push asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest
```

#### Cloud Runへのデプロイ

```bash
# 環境変数を設定してデプロイ
gcloud run deploy harvest-backend \
  --image asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --project=$PROJECT_ID
```

### 2. フロントエンド（Firebase Hosting）

```bash
# プロジェクトルートに戻る
cd ..

# 環境変数の設定
cat > .env.production <<EOF
NODE_ENV=production
VITE_USE_EMULATOR=false
VITE_API_BASE_URL=$(gcloud run services describe harvest-backend \
  --region=asia-northeast1 --format='value(status.url)')/api/v2
VITE_PROJECT_ID=${PROJECT_ID}
VITE_FRONTEND_URL=https://${PROJECT_ID}.web.app
EOF

# ビルド
npm install
npm run build:production

# Firebase Hostingにデプロイ
firebase deploy --only hosting --project=$PROJECT_ID
```

### 3. 初期データ設定

```bash
cd server

# 管理者ユーザー作成
npm run create-admin:firestore

# ヘルスチェック
BACKEND_URL=$(gcloud run services describe harvest-backend \
  --region=asia-northeast1 --format='value(status.url)')
curl ${BACKEND_URL}/health
```

## 環境別設定

### 開発環境（ローカル）

```bash
# Firestore Emulatorの起動
firebase emulators:start --only firestore,auth \
  --config firebase.local.json

# 別ターミナルでサーバー起動
cd server
npm run dev

# 別ターミナルでフロントエンド起動
npm run dev
```

### ステージング環境

```bash
# 環境変数設定
export NODE_ENV=staging
export PROJECT_ID=harvest-staging

# デプロイ
npm run build:staging
firebase deploy --only hosting --project=$PROJECT_ID
```

### 本番環境

```bash
# 環境変数設定
export NODE_ENV=production
export PROJECT_ID=harvest-a82c0

# デプロイ
npm run build:production
firebase deploy --only hosting --project=$PROJECT_ID
```

## トラブルシューティング

### よくあるエラーと対処法

#### 1. Firestoreデータベース重複エラー

```bash
# Error: Database already exists
# 対処: 既存データベースを使用するか、削除してから再作成

# 既存データベースの確認
gcloud firestore databases list --project=$PROJECT_ID

# terraform.tfvarsで既存DBを使用
# またはfree-tier.tfを編集してdata sourceを使用
```

#### 2. Budget API権限エラー

```bash
# Error: billingbudgets.googleapis.com requires a quota project
# 対処: プロジェクトを設定

gcloud config set project $PROJECT_ID
gcloud auth application-default set-quota-project $PROJECT_ID
```

#### 3. Cloud Run APIエラー

```bash
# Error: cloudrun.googleapis.com not found
# 対処: 正しいAPI名を使用

# 誤: cloudrun.googleapis.com
# 正: run.googleapis.com
gcloud services enable run.googleapis.com
```

#### 4. Dockerプッシュエラー

```bash
# Error: denied: Permission denied
# 対処: 認証設定

gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

## コスト管理

### 予算アラートの確認

```bash
# Webコンソールで確認
open "https://console.cloud.google.com/billing/budgets?project=${PROJECT_ID}"

# CLIで予算を確認
gcloud billing budgets list --billing-account=017831-B01AF3-3A53DC
```

### 使用量モニタリング

```bash
# Cloud Run使用量
gcloud run services describe harvest-backend \
  --region=asia-northeast1 \
  --format="value(status.traffic[0].percent,spec.template.spec.containers[0].resources)"

# Firestore使用量（日次）
gcloud firestore operations list --limit=10

# 現在の請求額
gcloud billing accounts describe 017831-B01AF3-3A53DC
```

### コスト削減チェックリスト

- [ ] Cloud Run最小インスタンス: 0
- [ ] Cloud Run最大インスタンス: 1
- [ ] キャッシュ有効化: 1時間
- [ ] ウォームアップ: ビジネスアワーのみ
- [ ] Firebase Hosting使用（CDN無料）
- [ ] Firestore単一リージョン
- [ ] 予算アラート設定: ¥1,000

## メンテナンス

### アプリケーション更新

```bash
# バックエンド更新
cd server
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest
gcloud run deploy harvest-backend --image asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest

# フロントエンド更新
cd ..
npm run build:production
firebase deploy --only hosting
```

### インフラ更新

```bash
cd deploy/terraform
terraform plan
terraform apply
```

### 完全削除（注意！）

```bash
# Terraformリソース削除
terraform destroy -auto-approve

# プロジェクト削除（すべてのデータが失われます）
gcloud projects delete $PROJECT_ID
```

## 📝 チェックリスト

### 初回デプロイ
- [ ] GCPプロジェクト作成/設定
- [ ] 請求先アカウントリンク
- [ ] 必要なAPI有効化
- [ ] Terraform状態バケット作成
- [ ] terraform.tfvars設定
- [ ] Terraform apply実行
- [ ] Dockerイメージビルド・プッシュ
- [ ] Cloud Runデプロイ
- [ ] Firebase Hostingデプロイ
- [ ] ヘルスチェック確認
- [ ] 予算アラート確認

### 日次確認
- [ ] Cloud Run稼働状況
- [ ] Firestore使用量
- [ ] エラーログ確認
- [ ] コスト確認

## サポート

問題が発生した場合：

1. エラーメッセージを確認
2. GCPコンソールでログを確認
3. `terraform output`で設定を確認
4. このガイドのトラブルシューティングを参照

---

最終更新: 2025年8月10日
バージョン: 1.0.0