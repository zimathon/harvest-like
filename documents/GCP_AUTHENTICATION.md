# GCP認証ガイド

## 概要
このドキュメントでは、Harvest-likeプロジェクトで使用されているGCP（Google Cloud Platform）の認証の仕組みについて説明します。

## Application Default Credentials (ADC)

### ADCとは
Application Default Credentials（ADC）は、Google Cloud APIへのアクセスを簡単にするための認証メカニズムです。開発者が明示的に認証情報を管理する必要がなく、環境に応じて適切な認証情報が自動的に使用されます。

### 設定ファイルの場所
```
~/.config/gcloud/application_default_credentials.json
```

### 認証タイプ
- **authorized_user**: ユーザーアカウントによる認証
- **service_account**: サービスアカウントによる認証（本番環境推奨）

## 認証が長期間有効な理由

### 1. リフレッシュトークンの仕組み
- ADCファイルには**リフレッシュトークン**が含まれています
- アクセストークンの有効期限は通常1時間ですが、期限切れ時に自動的に新しいトークンを取得
- リフレッシュトークン自体は無期限または非常に長期間（6ヶ月以上）有効

### 2. 自動更新メカニズム
```
アクセストークン（1時間）
    ↓ 期限切れ
リフレッシュトークンを使用
    ↓
新しいアクセストークンを取得
    ↓
API呼び出し継続
```

### 3. SDKの自動処理
- Google Cloud SDKやFirestore SDKが自動的にトークンの更新を処理
- 開発者は認証の更新を意識する必要がない

## 認証情報の優先順位

アプリケーションは以下の順序で認証情報を探します：

1. **環境変数 `GOOGLE_APPLICATION_CREDENTIALS`**
   - サービスアカウントキーファイルへのパス
   - 最優先で使用される

2. **Application Default Credentials**
   - `~/.config/gcloud/application_default_credentials.json`
   - 開発環境で一般的

3. **gcloudのデフォルト設定**
   - `gcloud config`で設定されたアカウント

4. **メタデータサービス**
   - GCE、Cloud Run、App Engineなどの環境
   - 自動的にサービスアカウントが付与される

## 認証管理コマンド

### 基本的なコマンド
```bash
# 現在の認証状態を確認
gcloud auth list

# アクティブなアカウントを確認
gcloud config get-value account

# プロジェクトを確認
gcloud config get-value project

# ADCの状態を確認（アクセストークンを表示）
gcloud auth application-default print-access-token
```

### 認証の設定・更新
```bash
# ADCの初期設定（初回のみ）
gcloud auth application-default login

# 通常のgcloud認証
gcloud auth login

# 別のアカウントに切り替え
gcloud config set account [ACCOUNT_EMAIL]

# プロジェクトの切り替え
gcloud config set project [PROJECT_ID]
```

### 認証のリセット
```bash
# ADCを無効化
gcloud auth application-default revoke

# すべての認証情報をクリア
gcloud auth revoke --all

# 再度ログイン
gcloud auth application-default login
```

## 環境別の認証設定

### 開発環境（ローカル）
```javascript
// Firestoreの初期化例
import { Firestore } from '@google-cloud/firestore';

// ADCを自動的に使用
const db = new Firestore({
  projectId: 'harvest-a82c0'
});
```

### 本番環境（Cloud Run）
- Cloud Runではデフォルトのサービスアカウントが自動的に使用される
- IAMで適切な権限を付与する必要がある
- カスタムサービスアカウントの使用も可能

### CI/CD環境
```bash
# サービスアカウントキーを使用
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

## セキュリティのベストプラクティス

### 1. ファイル権限
```bash
# ADCファイルは適切な権限で保護されているか確認
ls -la ~/.config/gcloud/application_default_credentials.json
# 出力: -rw------- (600)
```

### 2. サービスアカウントの使用
- 本番環境では必ずサービスアカウントを使用
- 最小権限の原則に従ってIAMロールを設定
- キーのローテーションを定期的に実施

### 3. 認証情報の管理
- サービスアカウントキーをGitにコミットしない
- `.gitignore`に追加：
  ```
  *.json
  service-account-*.json
  firebase-service-account.json
  ```

### 4. 環境変数の使用
```bash
# .envファイル（開発環境のみ）
PROJECT_ID=harvest-a82c0
GOOGLE_CLOUD_PROJECT=harvest-a82c0
```

## トラブルシューティング

### 認証エラーが発生した場合
1. 現在の認証状態を確認
   ```bash
   gcloud auth list
   gcloud config list
   ```

2. ADCをリセット
   ```bash
   gcloud auth application-default revoke
   gcloud auth application-default login
   ```

3. プロジェクトIDを確認
   ```bash
   echo $GOOGLE_CLOUD_PROJECT
   gcloud config get-value project
   ```

### 権限エラーが発生した場合
1. IAMロールを確認
   ```bash
   gcloud projects get-iam-policy [PROJECT_ID]
   ```

2. 必要な権限を付与
   ```bash
   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="user:[EMAIL]" \
     --role="roles/editor"
   ```

## 参考リンク
- [Google Cloud認証の概要](https://cloud.google.com/docs/authentication)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [IAMの概要](https://cloud.google.com/iam/docs/overview)