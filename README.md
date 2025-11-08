# Harvest-like 時間管理アプリケーション

Harvest にインスパイアされた、React、TypeScript、Firebase で構築されたモダンなフルスタック時間管理アプリケーション。

## 🌟 機能

- ⏱️ **時間トラッキング**: プロジェクトとタスクのタイマー開始/停止
- 📊 **複数のビュー**: 日、週、月、全エントリービュー
- 📈 **合計時間表示**: 各期間のリアルタイム合計時間計算
- 👥 **チーム管理**: ユーザーとロールの管理
- 📝 **プロジェクト & タスク管理**: プロジェクトとタスクで作業を整理
- 💰 **請求対応**: タスクを請求可能/不可能としてマーク
- 📱 **レスポンシブデザイン**: デスクトップとモバイルで動作
- 🔐 **認証**: JWT による安全なユーザー認証
- ☁️ **クラウドネイティブ**: Google Cloud Platform と Firebase にデプロイ

## 🚀 本番環境

### 本番環境 URL
- **フロントエンド**: [harvest-a82c0.web.app](https://harvest-a82c0.web.app)
- **バックエンド API**: [harvest-backend-sxoezkwvgq-an.a.run.app](https://harvest-backend-sxoezkwvgq-an.a.run.app)
  - API ベース: `https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2`

### デモアカウント
- **Email**: `admin@example.com`
- **Password**: `admin123`

### 管理コンソール
- [Firebase コンソール](https://console.firebase.google.com/project/harvest-a82c0)
- [Cloud Run コンソール](https://console.cloud.google.com/run/detail/asia-northeast1/harvest-backend/metrics?project=harvest-a82c0)
- [Firestore コンソール](https://console.firebase.google.com/project/harvest-a82c0/firestore)

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: React 18 with TypeScript
- **ビルドツール**: Vite
- **UI ライブラリ**: Chakra UI
- **状態管理**: React Context API
- **HTTP クライアント**: Axios
- **ルーティング**: React Router v6

### バックエンド
- **ランタイム**: Node.js 20
- **フレームワーク**: Express.js with TypeScript
- **データベース**: Google Cloud Firestore
- **認証**: JWT (jsonwebtoken)
- **バリデーション**: express-validator
- **CORS**: 本番環境用に設定済み

### インフラストラクチャ
- **フロントエンド ホスティング**: Firebase Hosting
- **バックエンド ホスティング**: Google Cloud Run
- **データベース**: Google Cloud Firestore
- **CI/CD**: GitHub Actions
- **コンテナレジストリ**: Google Artifact Registry

## 📁 プロジェクト構造

```
harvest-like/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── deploy-staging.yml
│       ├── deploy-production.yml
│       └── deploy-to-gcp.yml
├── server/                 # バックエンド (Node.js/Express)
│   ├── src/
│   │   ├── controllers/    # リクエストハンドラ
│   │   ├── middleware/     # 認証、バリデーション等
│   │   ├── routes/         # API ルート
│   │   ├── services/       # ビジネスロジック
│   │   └── index.ts        # エントリーポイント
│   ├── package.json
│   └── tsconfig.json
├── src/                    # フロントエンド (React)
│   ├── components/         # 再利用可能なコンポーネント
│   ├── contexts/           # Context プロバイダ
│   ├── pages/              # ページコンポーネント
│   ├── services/           # API クライアント
│   ├── types/              # TypeScript 型定義
│   └── main.tsx            # エントリーポイント
├── deploy/                 # デプロイスクリプト
├── docs/                   # ドキュメント
├── package.json
├── vite.config.ts
└── README.md
```

## 🚀 はじめに

### 前提条件

- **Node.js**: v20.x 以降 (LTS 推奨)
- **npm**: v9.x 以降
- **Google Cloud アカウント**: Firestore 用 (またはエミュレータ使用)

### クイックスタート (推奨)

対話型起動スクリプトを使用:

```bash
./scripts/quick-start-local.sh
```

メニューオプション:
1. Firestore で起動 (本番モード)
2. Firestore エミュレータで起動 (開発モード)
3. 両方起動 (マイグレーションテスト用)
4. 全サービス停止
5. サービス状態確認

### 手動セットアップ

#### 1. バックエンドセットアップ

```bash
cd server
npm install
```

`server/` ディレクトリに `.env` ファイルを作成:

```env
PORT=5001
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://harvest-a82c0.web.app

# Firestore 設定
PROJECT_ID=harvest-a82c0
GOOGLE_CLOUD_PROJECT=harvest-a82c0
USE_FIRESTORE_EMULATOR=false
FIRESTORE_EMULATOR_HOST=localhost:8090
```

バックエンドを起動:

```bash
npm run dev
```

サーバー起動: `http://localhost:5001`

#### 2. フロントエンドセットアップ

```bash
# プロジェクトルートから
npm install
npm run dev
```

フロントエンド起動: `http://localhost:5173`

### 別の方法: 全サービスをまとめて起動

```bash
# 本番 Firestore で起動
npm run dev:firestore

# Firestore エミュレータで起動
npm run dev:emulator

# 全サービス停止
npm run stop:all
```

## 🔐 管理者ユーザーの作成

`server` ディレクトリから:

```bash
npm run create-admin -- --name "Admin User" --email admin@example.com --password admin123
```

または対話型スクリプトを使用 (Firestore):

```bash
npm run create-admin:firestore
```

デフォルト管理者ユーザー:
- Email: `admin@example.com` / Password: `admin123`
- Email: `admin2@example.com` / Password: `password`

## 📦 本番環境用ビルド

### フロントエンド

```bash
npm run build
```

出力: `dist/` ディレクトリ

### バックエンド

```bash
cd server
npm run build
```

出力: `server/dist/` ディレクトリ

## 🚢 デプロイ

### 自動デプロイ (GitHub Actions)

**ステージング** (プレビューデプロイ):
- Pull Request でトリガー
- Firebase Hosting プレビューチャンネルにデプロイ
- プレビュー URL が PR コメントに投稿

**本番環境**:
- `main` ブランチへのプッシュでトリガー
- フロントエンド: Firebase Hosting
- バックエンド: Google Cloud Run

### 手動デプロイ

詳細ガイド:
- [デプロイガイド](./DEPLOYMENT.md)
- [GCP デプロイガイド](./GCP_DEPLOYMENT_GUIDE.md)
- [GCP 無料枠ガイド](./GCP_FREE_TIER_GUIDE.md)

## 📚 追加ドキュメント

- [クイックスタートガイド](./QUICK_START.md)
- [ローカル開発ガイド](./LOCAL_DEVELOPMENT.md)
- [ローカルセットアップ クイックリファレンス](./LOCAL_SETUP_QUICK.md)
- [API 型安全性](./API_TYPE_SAFETY.md)
- [Firestore 永続化](./FIRESTORE_PERSISTENCE.md)
- [メール設定](./EMAIL_SETUP.md)
- [マイグレーション計画](./MIGRATION_PLAN.md)
- [ログモニタリングエージェント](./LOG_MONITOR_AGENT.md)
- [GCP コスト見積もり](./GCP_COST_ESTIMATION.md)

## 🧪 テスト

フロントエンドテスト実行:

```bash
npm test
```

E2E テスト実行:

```bash
npm run test:e2e
```

## 🔧 開発ツール

### コード生成

OpenAPI 仕様から API 型を生成:

```bash
npm run generate:types
```

ウォッチモード:

```bash
npm run generate:types:watch
```

### Firestore エミュレータ

エミュレータデータをクリア:

```bash
cd server
npm run firestore:clear
```

### モニタリング

ログモニタリング付きで起動:

```bash
npm run dev:monitored
```

## 🌐 環境変数

### フロントエンド

プロジェクトルートに `.env` ファイルを作成:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v2
```

本番環境ファイル:
- `.env.production` - 本番設定
- `.env.development` - 開発設定

### バックエンド

利用可能なオプションは `server/.env.example` を参照。

## 🤝 コントリビューション

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) に従います:

- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメント変更
- `style:` - コードスタイル変更
- `refactor:` - コードリファクタリング
- `test:` - テスト更新
- `chore:` - ビルド/ツール変更

## 📝 ライセンス

このプロジェクトはプライベートかつプロプライエタリです。

## 🙏 謝辞

- [Harvest](https://www.getharvest.com/) にインスパイア
- [Chakra UI](https://chakra-ui.com/) で構築
- [Google Cloud Platform](https://cloud.google.com/) で動作
- [GitHub Actions](https://github.com/features/actions) で CI/CD

## 📞 サポート

問題や質問については、GitHub の issue tracker をご利用ください。

---

**最終更新**: 2025年11月
