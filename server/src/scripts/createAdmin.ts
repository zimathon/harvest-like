import dotenv from 'dotenv';
import path from 'path';
import url from 'url';
import { connectDB, disconnectDB } from '../config/db.js'; // DB接続/切断関数をインポート
import User from '../models/User.js'; // User モデルをインポート

// --- ESM で __dirname を取得 ---
const __filename = url.fileURLToPath(import.meta.url); // <<< 現在のファイルパスを取得
const __dirname = path.dirname(__filename);           // <<< ディレクトリパスを取得

// コマンドライン引数を解析するヘルパー関数 (簡易版)
const getArgValue = (argName: string): string | undefined => {
  const argIndex = process.argv.indexOf(argName);
  if (argIndex > -1 && process.argv.length > argIndex + 1) {
    return process.argv[argIndex + 1];
  }
  return undefined;
};

// 環境変数を読み込む (server ディレクトリからの相対パス)
// スクリプトが src/scripts または dist/scripts にあるので、2階層上がる
const envPath = path.resolve(__dirname, '../../.env'); // <<< __dirname を使うのはOK
dotenv.config({ path: envPath });

// --- メイン処理 ---
const createAdminUser = async () => {
  console.log('Attempting to create admin user...');

  // 引数からユーザー情報を取得
  const name = getArgValue('--name');
  const email = getArgValue('--email');
  const password = getArgValue('--password');

  if (!name || !email || !password) {
    console.error('Error: Please provide --name, --email, and --password arguments.');
    process.exit(1); // 引数不足で終了
  }

  try {
    // データベースに接続
    await connectDB();
    console.log('Database connected.');

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      return; // 既に存在する場合は終了
    }

    // 管理者ユーザーを作成
    const adminUser = await User.create({
      name,
      email,
      password, // パスワードは pre-save フックでハッシュ化される
      role: 'admin' // ロールを admin に設定
    });

    console.log('Admin user created successfully:');
    console.log(` Name: ${adminUser.name}`);
    console.log(` Email: ${adminUser.email}`);
    console.log(` Role: ${adminUser.role}`);

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1); // エラーで終了
  } finally {
    // データベース接続を切断
    await disconnectDB();
    console.log('Database disconnected.');
  }
};

// スクリプトを実行
createAdminUser(); 