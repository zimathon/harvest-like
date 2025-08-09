# ローカル環境でのFirestore移行ガイド

## 1. Firestoreエミュレータのセットアップ

### 必要なツールのインストール

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# Java 11以上が必要（macOSの場合）
brew install openjdk@11
```

### エミュレータの起動

**ターミナル1（エミュレータ用）:**
```bash
./scripts/setup-firestore-local.sh
```

これにより以下が起動します：
- Firestore エミュレータ: http://localhost:8080
- エミュレータUI: http://localhost:4000

## 2. Firestoreモデルのテスト

**ターミナル2（別のターミナル）:**
```bash
cd server
npm run test:firestore
```

まず、package.jsonに以下のスクリプトを追加：

```json
"scripts": {
  "test:firestore": "ts-node src/test-firestore.ts"
}
```

## 3. 段階的な移行手順

### Phase 1: 新しいAPIエンドポイントの作成（並行運用）

1. 既存のMongoDBエンドポイントは残したまま、Firestore用の新しいエンドポイントを作成
2. 例: `/api/users` (MongoDB) と `/api/v2/users` (Firestore)

### Phase 2: コントローラーの更新

以下のファイルを更新：
- `server/src/controllers/auth.ts`
- `server/src/controllers/users.ts`
- `server/src/controllers/projects.ts`
- `server/src/controllers/clients.ts`
- `server/src/controllers/timeEntries.ts`

### Phase 3: フロントエンドの更新

APIのベースURLを環境変数で切り替え可能にする：

```typescript
// .env.development
VITE_API_VERSION=v2  // Firestore版を使用
# VITE_API_VERSION=v1  // MongoDB版を使用
```

## 4. データ移行スクリプト

```bash
cd server
npm run migrate:mongo-to-firestore
```

## 5. 移行チェックリスト

- [ ] Firestoreエミュレータが起動している
- [ ] test-firestore.tsが正常に実行される
- [ ] 各モデルのCRUD操作が動作する
- [ ] リレーションの解決（populate）が動作する
- [ ] 既存のデータが正しく移行される
- [ ] フロントエンドが新しいAPIで動作する

## 6. トラブルシューティング

### エミュレータが起動しない
```bash
# Javaのバージョンを確認
java -version  # 11以上である必要があります

# ポートが使用中の場合
lsof -i :8080  # 使用中のプロセスを確認
kill -9 <PID>  # プロセスを終了
```

### Firestoreの接続エラー
```bash
# 環境変数を確認
echo $NODE_ENV  # developmentであることを確認

# エミュレータのログを確認
firebase emulators:start --only firestore --debug
```

## 次のステップ

1. まず `test-firestore.ts` を実行して、Firestoreモデルが正しく動作することを確認
2. 1つのコントローラー（例: users）から段階的に移行
3. フロントエンドで新旧両方のAPIをテスト
4. 問題がなければ、他のコントローラーも移行

現在作成済みのFirestoreモデル：
- ✅ User
- ✅ Client  
- ✅ Project
- ✅ TimeEntry
- ⏳ Expense（未作成）
- ⏳ Invoice（未作成）