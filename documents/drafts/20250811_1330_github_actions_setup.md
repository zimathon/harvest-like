# GitHub Actions 自動デプロイ設定ガイド

## 🚀 概要

mainブランチへのプッシュで自動的に本番環境へデプロイする仕組みを構築しました。

## 📋 必要なGitHub Secrets

以下のSecretsをGitHubリポジトリに設定する必要があります：

### 1. GCP_SA_KEY（必須）

Google Cloud Service Accountのキーを設定します。

#### 作成手順：

```bash
# 1. サービスアカウントを作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy" \
  --project=harvest-a82c0

# 2. 必要な権限を付与
gcloud projects add-iam-policy-binding harvest-a82c0 \
  --member="serviceAccount:github-actions@harvest-a82c0.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding harvest-a82c0 \
  --member="serviceAccount:github-actions@harvest-a82c0.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding harvest-a82c0 \
  --member="serviceAccount:github-actions@harvest-a82c0.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 3. キーを作成
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@harvest-a82c0.iam.gserviceaccount.com

# 4. キーの内容をコピー
cat github-actions-key.json
```

GitHubで設定：
1. リポジトリの Settings → Secrets and variables → Actions
2. "New repository secret" をクリック
3. Name: `GCP_SA_KEY`
4. Value: 上記でコピーしたJSONの内容全体
5. "Add secret" をクリック

### 2. FIREBASE_SERVICE_ACCOUNT（必須）

Firebase Hostingへのデプロイ用：

```bash
# Firebase service accountキーを作成
gcloud iam service-accounts keys create firebase-sa-key.json \
  --iam-account=firebase-adminsdk-xxxxx@harvest-a82c0.iam.gserviceaccount.com

# 内容をコピー
cat firebase-sa-key.json
```

GitHubで設定：
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: JSONの内容

### 3. JWT_SECRET（必須）

本番環境用のJWTシークレット：

```bash
# ランダムな文字列を生成
openssl rand -base64 32
```

GitHubで設定：
- Name: `JWT_SECRET`
- Value: 生成された文字列

### 4. CORS_ALLOWED_ORIGINS（必須）

許可するオリジンのリスト：

GitHubで設定：
- Name: `CORS_ALLOWED_ORIGINS`
- Value: `https://harvest-a82c0.web.app,https://harvest-a82c0.firebaseapp.com`

### 5. SLACK_WEBHOOK_URL（オプション）

デプロイ通知用（設定済みの場合はスキップ）：

GitHubで設定：
- Name: `SLACK_WEBHOOK_URL`
- Value: `https://hooks.slack.com/services/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`

## 🔄 デプロイフロー

### 本番デプロイ（main branch）

```mermaid
graph LR
    A[Push to main] --> B[Run Tests]
    B --> C[Build Backend Docker]
    B --> D[Build Frontend]
    C --> E[Push to Artifact Registry]
    E --> F[Deploy to Cloud Run]
    D --> G[Deploy to Firebase Hosting]
    F --> H[Notify Slack]
    G --> H
```

### ステージング/プレビュー（Pull Request）

```mermaid
graph LR
    A[Open/Update PR] --> B[Run Tests]
    B --> C[Build Frontend]
    C --> D[Deploy Preview to Firebase]
    D --> E[Comment on PR with URL]
```

## 🛠️ ローカルでのテスト

GitHub Actionsをローカルでテストする場合：

```bash
# actをインストール
brew install act

# ワークフローをテスト（dry-run）
act -n

# 実際に実行（要Docker）
act push --secret-file .env.secrets
```

`.env.secrets`の例：
```
GCP_SA_KEY={"type":"service_account",...}
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
JWT_SECRET=your-secret-key
CORS_ALLOWED_ORIGINS=https://harvest-a82c0.web.app
```

## 📝 トラブルシューティング

### 1. 権限エラー

```
Error: Permission 'run.services.update' denied on resource
```

解決方法：
```bash
gcloud projects add-iam-policy-binding harvest-a82c0 \
  --member="serviceAccount:github-actions@harvest-a82c0.iam.gserviceaccount.com" \
  --role="roles/run.admin"
```

### 2. Docker push エラー

```
denied: Permission "artifactregistry.repositories.uploadArtifacts" denied
```

解決方法：
```bash
gcloud projects add-iam-policy-binding harvest-a82c0 \
  --member="serviceAccount:github-actions@harvest-a82c0.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### 3. Firebase デプロイエラー

```
Error: Failed to get Firebase project harvest-a82c0
```

解決方法：
- Firebase service accountのキーが正しく設定されているか確認
- プロジェクトIDが正しいか確認

## 🎯 次のステップ

1. **Secretsの設定**
   - 上記の手順に従ってGitHub Secretsを設定

2. **テストデプロイ**
   ```bash
   # feature branchを作成してPRを開く
   git checkout -b test-github-actions
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: GitHub Actions deployment"
   git push origin test-github-actions
   # GitHubでPRを作成
   ```

3. **本番デプロイ**
   ```bash
   # PRをマージするとmainブランチへの自動デプロイが開始
   ```

## 📊 コスト最適化

- Cloud Run: min-instances=0で設定（使用時のみ起動）
- Firebase Hosting: 無料枠内で運用
- Artifact Registry: 古いイメージは定期的に削除

## 🔒 セキュリティ

- Secretsは暗号化されて保存
- Service Accountは最小権限の原則に従う
- JWTシークレットは定期的に更新推奨

---

*作成日: 2025年8月11日*
*プロジェクト: Harvest-like*