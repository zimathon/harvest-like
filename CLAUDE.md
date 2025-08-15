# Harvest-like プロジェクト設定

## 環境変数設定

### サーバー起動方法

```bash
# 開発環境でサーバーを起動
cd server
npm run dev
```

### 重要な環境変数

サーバーの `.env` ファイルに以下の設定が必要：

```env
# Firestore設定（本番Firebase使用）
PROJECT_ID=harvest-a82c0
GOOGLE_CLOUD_PROJECT=harvest-a82c0
USE_FIRESTORE_EMULATOR=false

# Firestoreエミュレータを使用する場合
# USE_FIRESTORE_EMULATOR=true
# FIRESTORE_EMULATOR_HOST=localhost:8090
```

### プロジェクトID
- Firebase/Firestore プロジェクトID: `harvest-a82c0`
- 間違ったプロジェクトID（使わない）: `gen-lang-client-0922328593`

## ユーザー権限

### 管理者ユーザー
- Email: `y.sasajima@siek.jp`
- Role: `admin`

### 権限設定
- `/api/v2/users` エンドポイント：認証されたユーザーは閲覧可能、作成・更新・削除はadminのみ
- Team ページ：認証されたユーザーがアクセス可能
- Reports ページ：認証されたユーザーがアクセス可能

## トラブルシューティング

### ログインエラー (500 Internal Server Error)
- 原因：Firestore プロジェクトIDが間違っている
- 解決：環境変数 `PROJECT_ID` と `GOOGLE_CLOUD_PROJECT` を `harvest-a82c0` に設定

### 403 Forbidden エラー
- 原因：ユーザーの権限不足
- 解決：
  1. `server/src/routes/users.firestore.ts` でルートの権限設定を確認
  2. 必要に応じてユーザーのロールをadminに変更

### ユーザーロール変更スクリプト
```javascript
// server/update-user-role.mjs
import { Firestore } from '@google-cloud/firestore';

const projectId = 'harvest-a82c0';
const db = new Firestore({ projectId });

// 実行: GOOGLE_CLOUD_PROJECT=harvest-a82c0 node update-user-role.mjs
```

## GCP認証の仕組み

### Application Default Credentials (ADC)
- **設定ファイル**: `~/.config/gcloud/application_default_credentials.json`
- **認証タイプ**: `authorized_user`（ユーザー認証）
- **作成方法**: `gcloud auth application-default login`

### 認証が長期間有効な理由
1. **リフレッシュトークン**: ADCファイルにリフレッシュトークンが含まれている
2. **自動更新**: アクセストークンが期限切れになると自動的に新しいトークンを取得
3. **長期有効性**: リフレッシュトークンは基本的に無期限（または非常に長期間）有効

### 認証情報の優先順位
アプリケーションは以下の順序で認証情報を探します：
1. 環境変数 `GOOGLE_APPLICATION_CREDENTIALS`
2. Application Default Credentials (`~/.config/gcloud/application_default_credentials.json`)
3. gcloudのデフォルト設定
4. GCE/Cloud Runなどのメタデータサービス

### 認証関連コマンド
```bash
# 現在の認証状態を確認
gcloud auth list

# アクティブなアカウントを確認
gcloud config get-value account

# ADCの状態を確認
gcloud auth application-default print-access-token

# ADCをリセット（認証をやり直す場合）
gcloud auth application-default revoke
gcloud auth application-default login

# 別のアカウントに切り替え
gcloud config set account [ACCOUNT_EMAIL]
```

### セキュリティ考慮事項
- ADCファイルは権限600で保護されている
- 複数プロジェクトで作業する場合は、プロジェクトごとにサービスアカウントの使用を推奨
- 定期的な認証情報の更新を推奨

### Cloud Runでの認証
Cloud Run上では、サービスアカウントが自動的に使用される：
- デフォルトのCompute Engine サービスアカウント
- または、カスタムサービスアカウントを指定可能
- IAMロールで適切な権限を付与する必要あり