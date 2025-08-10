# 🚀 ローカル開発環境セットアップガイド

## 📋 目次
1. [前提条件](#前提条件)
2. [初回セットアップ](#初回セットアップ)
3. [開発サーバーの起動方法](#開発サーバーの起動方法)
4. [環境別の起動コマンド](#環境別の起動コマンド)
5. [データ管理](#データ管理)
6. [トラブルシューティング](#トラブルシューティング)

## 前提条件

### 必要なツール
```bash
# Node.js (v18以上)
node --version

# Firebase CLI
npm install -g firebase-tools
firebase --version

# Firestore Emulator用のJava
java -version  # Java 11以上が必要
```

## 初回セットアップ

### 1. 依存関係のインストール

```bash
# プロジェクトルート
npm install

# サーバー側の依存関係
cd server
npm install
cd ..
```

### 2. 環境変数の設定

```bash
# フロントエンド用（.env.development）
cat > .env.development <<EOF
# ローカル開発環境設定
NODE_ENV=development

# Firestore Emulator設定
VITE_USE_EMULATOR=true
VITE_FIRESTORE_EMULATOR_HOST=localhost:8090
VITE_AUTH_EMULATOR_HOST=localhost:9099

# API設定（ローカル開発用）
VITE_API_BASE_URL=http://localhost:5001/api/v2

# プロジェクト設定（ローカル開発用）
VITE_PROJECT_ID=harvest-dev-local
EOF

# サーバー用（server/.env）
cat > server/.env <<EOF
# ローカル開発環境
NODE_ENV=development
PORT=5001

# Firestore Emulator
FIRESTORE_EMULATOR_HOST=localhost:8090

# JWT設定
JWT_SECRET=your-local-dev-secret-key

# CORS設定
CORS_ORIGIN=http://localhost:5173
EOF
```

### 3. Firebase Emulator設定

```bash
# Firebase初期化（初回のみ）
firebase init emulators

# 以下を選択:
# - Firestore Emulator
# - Authentication Emulator
# - Firestore Emulator port: 8090
# - Authentication Emulator port: 9099
# - Emulator UI port: 4000
# - Download emulators: Yes
```

## 開発サーバーの起動方法

### 🎯 方法1: Firestore Emulator付き開発（推奨）

```bash
# すべてを一度に起動（Firestore Emulator + Backend + Frontend）
npm run dev:firestore
```

このコマンドで以下が起動します：
- **Firestore Emulator** (ポート 8090)
- **バックエンドサーバー** (ポート 5001)
- **フロントエンド開発サーバー** (ポート 5173)
- **Emulator UI** (ポート 4000)

アクセスURL:
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:5001
- Emulator UI: http://localhost:4000

### 🎯 方法2: 個別起動（カスタマイズ可能）

#### ターミナル1: Firestore Emulator
```bash
cd server
npm run firestore:start
```

#### ターミナル2: バックエンドサーバー
```bash
cd server
FIRESTORE_EMULATOR_HOST=localhost:8090 npm run dev
```

#### ターミナル3: フロントエンド
```bash
npm run dev
```

### 🎯 方法3: モニタリング付き開発

```bash
# ログモニタリング付きで起動
npm run dev:monitored

# すべてのサービスをモニタリング付きで起動
npm run dev:all:monitored
```

## 環境別の起動コマンド

### 開発環境（Firestore Emulator使用）

```bash
# 基本的な開発サーバー
npm run dev:firestore

# フロントエンドのみ
npm run dev

# バックエンドのみ
cd server && npm run dev

# Firestoreエミュレータのみ
cd server && npm run firestore:start
```

### ステージング環境接続（実際のFirestore使用）

```bash
# ステージング環境に接続
npm run dev:staging

# 環境変数を設定
export NODE_ENV=staging
export PROJECT_ID=harvest-staging
npm run dev
```

### 本番環境データの確認（読み取り専用推奨）

```bash
# 本番環境の設定で起動（注意！）
export NODE_ENV=production
export PROJECT_ID=harvest-a82c0
npm run dev
```

## データ管理

### 初期データのセットアップ

```bash
# 管理者ユーザーの作成
cd server
npm run create-admin:firestore

# テストデータの投入
npm run migrate:firestore
```

### Firestoreデータの管理

```bash
# データのクリア
cd server
npm run firestore:clear

# データのエクスポート（自動保存）
# Emulator終了時に自動的に .firestore-data に保存される

# データのインポート
npm run firestore:start  # 自動的に .firestore-data から読み込み
```

### ユーザー管理

```bash
cd server

# ユーザー一覧表示
npm run list-users

# 管理者作成
npm run create-admin:firestore

# Firestore機能のテスト
npm run test:firestore:features
```

## サーバーの停止

### すべてのサービスを停止

```bash
# 一括停止コマンド
npm run stop:all
```

### 個別停止

```bash
# Ctrl+C で各ターミナルを停止
# または以下のコマンド

# ポートを指定して停止
lsof -ti:8090 | xargs kill -9  # Firestore Emulator
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:4000 | xargs kill -9  # Emulator UI
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. Firestore Emulatorが起動しない

```bash
# Javaがインストールされているか確認
java -version

# Javaがない場合はインストール
brew install openjdk@11

# ポートが使用中の場合
lsof -ti:8090 | xargs kill -9
```

#### 2. "FIRESTORE_EMULATOR_HOST" エラー

```bash
# 環境変数を設定
export FIRESTORE_EMULATOR_HOST=localhost:8090

# または package.json のスクリプトを使用
npm run dev:firestore
```

#### 3. CORS エラー

```bash
# server/.env を確認
CORS_ORIGIN=http://localhost:5173

# サーバーを再起動
cd server && npm run dev
```

#### 4. 認証エラー

```bash
# Firebase Admin SDKの初期化を確認
# server/src/config/firebase.ts を確認

# エミュレータモードで起動しているか確認
echo $FIRESTORE_EMULATOR_HOST  # localhost:8090 が表示されるべき
```

#### 5. ポート競合

```bash
# 使用中のポートを確認
lsof -i :8090  # Firestore
lsof -i :5001  # Backend
lsof -i :5173  # Frontend

# すべて停止してから再起動
npm run stop:all
npm run dev:firestore
```

## 開発のベストプラクティス

### 1. データの永続化

```bash
# Emulatorデータを保存したい場合
cd server
npm run firestore:start  # 終了時に自動保存

# データをクリアしたい場合
npm run firestore:clear
```

### 2. 複数環境の切り替え

```bash
# 環境変数で切り替え
NODE_ENV=development npm run dev  # ローカル
NODE_ENV=staging npm run dev      # ステージング
NODE_ENV=production npm run dev   # 本番（注意）
```

### 3. デバッグ

```bash
# ログレベルを上げる
DEBUG=* npm run dev

# Firestore Emulator UIでデータを確認
open http://localhost:4000
```

### 4. テスト実行

```bash
# E2Eテスト
npm run test:e2e

# バックエンドテスト
cd server && npm test

# Firestore機能テスト
cd server && npm run test:firestore:features
```

## 📝 クイックリファレンス

| コマンド | 説明 | ポート |
|---------|------|--------|
| `npm run dev:firestore` | すべて起動（推奨） | 8090, 5001, 5173, 4000 |
| `npm run dev` | フロントエンドのみ | 5173 |
| `cd server && npm run dev` | バックエンドのみ | 5001 |
| `cd server && npm run firestore:start` | Emulatorのみ | 8090, 4000 |
| `npm run stop:all` | すべて停止 | - |
| `npm run dev:monitored` | モニタリング付き | 同上 |

## 次のステップ

1. [本番環境へのデプロイ](deploy/terraform/DEPLOYMENT_GUIDE.md)
2. [Terraform設定](deploy/terraform/README.md)
3. [API仕様書](api/openapi.yaml)

---

最終更新: 2025年8月10日
バージョン: 1.0.0