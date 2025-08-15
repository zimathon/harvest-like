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