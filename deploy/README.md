# Harvest Deployment Guide for GCP

このガイドでは、Harvest アプリケーションを Google Cloud Platform (GCP) にデプロイする手順を説明します。

## アーキテクチャ

- **フロントエンド**: Cloud Storage + Cloud CDN
- **バックエンド**: Cloud Run
- **データベース**: Firestore
- **認証**: JWT (Secret Manager で管理)
- **インフラ管理**: Terraform

## 前提条件

1. **GCP アカウント**と有効な請求先アカウント
2. **gcloud CLI** のインストール
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   ```
3. **Terraform** のインストール
   ```bash
   # macOS
   brew install terraform
   ```
4. **Docker** のインストール (バックエンドのビルド用)

## デプロイ手順

### 1. 初期セットアップ

```bash
# セットアップスクリプトを実行
./scripts/setup-gcp.sh
```

このスクリプトは以下を行います：
- GCP プロジェクトの設定
- Terraform 状態管理用バケットの作成
- JWT シークレットの生成
- 環境設定ファイルの作成

### 2. Terraform でインフラをプロビジョニング

```bash
cd deploy/terraform

# Terraform を初期化（setup-gcp.sh の出力に従って STATE_BUCKET を指定）
terraform init -backend-config="bucket=YOUR-PROJECT-ID-terraform-state"

# 実行計画を確認
terraform plan

# インフラを作成
terraform apply
```

Terraform は以下のリソースを作成します：
- Cloud Run サービス
- Firestore データベース
- Cloud Storage バケット
- Load Balancer と SSL 証明書（カスタムドメイン用）
- サービスアカウントと IAM 権限

### 3. バックエンドのデプロイ

```bash
# Terraform の出力から backend_url を取得
export BACKEND_URL=$(cd deploy/terraform && terraform output -raw backend_url)

# .env.production に追記
echo "BACKEND_URL=${BACKEND_URL}" >> .env.production

# バックエンドをデプロイ
./scripts/deploy-backend.sh
```

### 4. フロントエンドのデプロイ

```bash
# フロントエンドをデプロイ
./scripts/deploy-frontend.sh
```

### 5. 初期管理者ユーザーの作成

```bash
# Cloud Run にSSH接続して管理者を作成
gcloud run services update harvest-backend \
  --region us-central1 \
  --command "npm run create-admin"
```

## 環境変数

### バックエンド (.env.production)
```env
PROJECT_ID=your-gcp-project-id
REGION=us-central1
NODE_ENV=production
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
CORS_ORIGIN=https://storage.googleapis.com/your-bucket-name
```

### フロントエンド (.env.production)
```env
VITE_API_URL=https://harvest-backend-xxxxx-uc.a.run.app
```

## コスト削減のヒント

1. **Cloud Run の設定**
   - 最小インスタンス数を 0 に設定（コールドスタート許容）
   - 同時実行数とメモリを必要最小限に設定

2. **Firestore の使用量**
   - 無料枠: 1GB ストレージ、50,000 読み取り/日、20,000 書き込み/日
   - インデックスを最適化して読み取り回数を削減

3. **Cloud Storage**
   - 静的アセットに長いキャッシュ期間を設定
   - 不要なファイルは定期的に削除

## トラブルシューティング

### CORS エラー
```bash
# Cloud Run の環境変数を更新
gcloud run services update harvest-backend \
  --update-env-vars CORS_ORIGIN=YOUR_FRONTEND_URL
```

### Firestore 権限エラー
```bash
# サービスアカウントの権限を確認
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:harvest-backend@PROJECT_ID.iam.gserviceaccount.com"
```

### デプロイのロールバック
```bash
# Cloud Run の前のリビジョンにロールバック
gcloud run services update-traffic harvest-backend \
  --to-revisions PREVIOUS_REVISION=100
```

## CI/CD パイプライン（オプション）

GitHub Actions を使用した自動デプロイの設定は `.github/workflows/deploy.yml` を参照してください。

## クリーンアップ

プロジェクトを削除する場合：

```bash
# Terraform でリソースを削除
cd deploy/terraform
terraform destroy

# GCS バケットを削除（Terraform 管理外の場合）
gsutil rm -r gs://YOUR-PROJECT-ID-harvest-frontend
gsutil rm -r gs://YOUR-PROJECT-ID-terraform-state
```