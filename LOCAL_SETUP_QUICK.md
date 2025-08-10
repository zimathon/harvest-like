# 🚀 ローカル環境クイックセットアップ

## ⚠️ 現在の問題
Firestore EmulatorにはJava 11以上が必要ですが、現在Java 8がインストールされています。

## 📋 セットアップ手順

### 1. Java 11以上のインストール（必須）

```bash
# macOSの場合
brew install openjdk@17

# インストール後、パスを設定
echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 確認
java -version  # 17.x.x が表示されるべき
```

### 2. 依存関係のインストール

```bash
# プロジェクトルート
npm install

# サーバー
cd server
npm install
cd ..
```

### 3. ローカル開発の起動

#### 方法A: すべて一度に起動（推奨）
```bash
npm run dev:firestore
```

これで以下が起動します：
- Firestore Emulator (http://localhost:4000)
- バックエンド (http://localhost:5001)
- フロントエンド (http://localhost:5173)

#### 方法B: 個別起動
```bash
# ターミナル1
cd server && npm run firestore:start

# ターミナル2
cd server && FIRESTORE_EMULATOR_HOST=localhost:8090 npm run dev

# ターミナル3
npm run dev
```

### 4. 管理者ユーザーの作成

```bash
cd server
npm run create-admin:firestore
```

### 5. アクセス確認

- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:5001/health
- Firestore Emulator UI: http://localhost:4000

## 🔧 Java無しでの暫定対処（本番Firestoreを使用）

⚠️ **注意**: 本番データベースを使用するため、データの取り扱いに注意してください。

### 本番Firestoreを使った開発

```bash
# 1. GCP認証
gcloud auth application-default login

# 2. 環境変数設定
export GOOGLE_CLOUD_PROJECT=harvest-a82c0
export NODE_ENV=development

# 3. バックエンド起動（本番Firestore使用）
cd server
npm run dev

# 4. フロントエンド起動
cd ..
npm run dev
```

## 📝 推奨事項

1. **Java 17のインストールを強く推奨**
   - Firestore Emulatorでローカル開発が可能
   - 本番データに影響しない
   - オフライン開発が可能

2. **本番Firestore使用時の注意**
   - 読み取り/書き込み制限に注意（無料枠）
   - テストデータは必ず削除
   - 本番データを変更しない

## 🚨 トラブルシューティング

### Java関連のエラー
```bash
# Javaのバージョン確認
java -version

# JAVA_HOMEの設定
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
```

### ポート競合
```bash
# 使用中のポートを確認
lsof -i :8090  # Firestore
lsof -i :5001  # Backend
lsof -i :5173  # Frontend

# すべて停止
npm run stop:all
```

---
更新日: 2025年8月10日