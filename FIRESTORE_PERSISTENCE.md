# Firestore エミュレータのデータ永続化設定

## 概要
Firestore エミュレータのデータを永続化する設定を実装しました。これにより、エミュレータを再起動してもデータが保持されます。

## 設定内容

### 1. firebase.json の更新
- `singleProjectMode: true` を追加

### 2. 起動スクリプトの更新
`server/package.json` の `firestore:start` スクリプトに以下のオプションを追加：
- `--import=./.firestore-data`: 起動時に保存済みデータを読み込み
- `--export-on-exit`: 終了時にデータを自動保存

### 3. データ保存ディレクトリ
- `server/.firestore-data/`: エミュレータのデータが保存されるディレクトリ
- .gitignore に追加済み（データはリポジトリに含まれません）

## 使用方法

### エミュレータの起動（データ永続化あり）
```bash
npm run stop:all  # 既存のプロセスを停止
npm run dev:firestore  # Firestore版で起動
```

### データのリセット

#### 方法1: npm スクリプト（serverディレクトリから）
```bash
cd server
npm run firestore:clear
```

#### 方法2: シェルスクリプト（プロジェクトルートから）
```bash
./scripts/clear-firestore-data.sh
```
※ 確認プロンプトが表示されます

#### 方法3: 手動削除
```bash
rm -rf server/.firestore-data/
```

### 初回起動時
1. エミュレータを起動
2. Admin ユーザーを作成
```bash
cd server
npm run create-admin:firestore
```

## 注意事項
- エミュレータを `Ctrl+C` で正常終了させることで、データが自動的に保存されます
- 強制終了（kill -9 など）した場合、データが保存されない可能性があります
- データディレクトリ（`.firestore-data/`）は Git で管理されません

## メリット
- テストデータやプロジェクト設定が保持される
- 開発中の作業が継続可能
- E2Eテストの実行が容易になる（毎回データを作成する必要がない）