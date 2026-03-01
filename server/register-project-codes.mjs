/**
 * プロジェクトコードとタスクサブコードの一括登録スクリプト
 *
 * 機能:
 *   1. メモ（notes）内のコード候補を検出して自動設定
 *   2. コード候補がない場合、プロジェクト名からコードを自動生成
 *   3. タスクのサブコードも自動生成
 *   4. --dry-run オプションで変更内容のプレビューのみ
 *
 * 実行方法:
 *   cd server
 *
 *   # プレビュー（変更なし）
 *   GOOGLE_CLOUD_PROJECT=harvest-a82c0 node register-project-codes.mjs --dry-run
 *
 *   # 実行（Firestoreに書き込み）
 *   GOOGLE_CLOUD_PROJECT=harvest-a82c0 node register-project-codes.mjs
 *
 *   # 特定のプロジェクトにコードを指定して登録
 *   GOOGLE_CLOUD_PROJECT=harvest-a82c0 node register-project-codes.mjs --set PROJECT_ID=CODE
 *
 *   # 上書きモード（既存コードも更新）
 *   GOOGLE_CLOUD_PROJECT=harvest-a82c0 node register-project-codes.mjs --force
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';

const projectId = 'harvest-a82c0';
const db = new Firestore({ projectId });

// コマンドライン引数の解析
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

// --set PROJECT_ID=CODE 形式の手動指定を解析
const manualCodes = new Map();
args.forEach((arg, index) => {
  if (arg === '--set' && args[index + 1]) {
    const [projId, code] = args[index + 1].split('=');
    if (projId && code) {
      manualCodes.set(projId, code);
    }
  }
});

/**
 * プロジェクト名からコードを自動生成
 * 例: "ウェブサイトリニューアル" → "WEB"（英語部分があれば使用）
 *     "Project Alpha" → "PA"
 *     "プロジェクトA" → "PJA"
 */
function generateCodeFromName(name, existingCodes) {
  // 英語の単語を抽出
  const englishWords = name.match(/[A-Za-z]+/g) || [];

  let baseCode = '';

  if (englishWords.length > 0) {
    if (englishWords.length === 1) {
      // 単語が1つなら最初の3-4文字
      baseCode = englishWords[0].substring(0, 4).toUpperCase();
    } else {
      // 複数単語なら頭文字を結合
      baseCode = englishWords.map(w => w[0]).join('').toUpperCase();
      if (baseCode.length < 2) baseCode = englishWords[0].substring(0, 3).toUpperCase();
    }
  } else {
    // 英語がない場合は「PJ」＋連番
    baseCode = 'PJ';
  }

  // 重複チェック、重複する場合は連番を付与
  let code = baseCode;
  let counter = 1;
  while (existingCodes.has(code)) {
    counter++;
    code = `${baseCode}${counter}`;
  }

  return code;
}

async function registerProjectCodes() {
  try {
    console.log(isDryRun
      ? '=== プレビューモード（変更なし） ==='
      : '=== プロジェクトコード一括登録 ===');
    console.log('');

    // 1. 全プロジェクトを取得
    const projectsSnapshot = await db.collection('projects').get();
    const projects = [];
    projectsSnapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📁 プロジェクト数: ${projects.length}\n`);

    // 2. 全時間記録を取得してメモからコード候補を抽出
    const timeEntriesSnapshot = await db.collection('timeEntries').get();
    const notesCodes = new Map(); // projectId → most common code

    const codePatterns = [
      /([A-Z]{2,10}[-_]\d{1,5})/g,
      /\[([A-Z0-9]{2,10}[-_]?\d{0,5})\]/g,
    ];

    timeEntriesSnapshot.forEach(doc => {
      const entry = doc.data();
      const notes = entry.notes || entry.description || '';
      if (!notes.trim() || !entry.projectId) return;

      for (const pattern of codePatterns) {
        const matches = notes.matchAll(pattern);
        for (const match of matches) {
          const code = match[1] || match[0];
          // プロジェクトコードとして使えそうなもの（サブコード形式 XXX-001-01 は除外）
          if (code.split('-').length <= 2) {
            if (!notesCodes.has(entry.projectId)) {
              notesCodes.set(entry.projectId, new Map());
            }
            const codeCounts = notesCodes.get(entry.projectId);
            codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
          }
        }
      }
    });

    // 3. 各プロジェクトのコードを決定
    const existingCodes = new Set(projects.filter(p => p.code).map(p => p.code));
    const updates = []; // { projectId, projectName, oldCode, newCode, tasks }

    for (const project of projects) {
      // 既にコードが設定済みで、--force でない場合はスキップ
      if (project.code && !isForce && !manualCodes.has(project.id)) {
        console.log(`  ✅ ${project.name}: 既存コード「${project.code}」を保持`);
        continue;
      }

      let newCode = null;

      // 優先度1: 手動指定
      if (manualCodes.has(project.id)) {
        newCode = manualCodes.get(project.id);
      }

      // 優先度2: メモから抽出したコード
      if (!newCode && notesCodes.has(project.id)) {
        const codeCounts = notesCodes.get(project.id);
        // 最も頻出のコードを使用
        let maxCount = 0;
        for (const [code, count] of codeCounts) {
          if (count > maxCount && !existingCodes.has(code)) {
            maxCount = count;
            newCode = code;
          }
        }
        if (newCode) {
          console.log(`  🔍 ${project.name}: メモから検出「${newCode}」（${maxCount}回出現）`);
        }
      }

      // 優先度3: プロジェクト名から自動生成
      if (!newCode) {
        newCode = generateCodeFromName(project.name, existingCodes);
        console.log(`  🔄 ${project.name}: 名前から自動生成「${newCode}」`);
      }

      existingCodes.add(newCode);

      // タスクのサブコード生成
      const tasks = (project.tasks || []).map((task, index) => ({
        ...task,
        subCode: task.subCode && !isForce
          ? task.subCode
          : `${newCode}-${String(index + 1).padStart(2, '0')}`
      }));

      updates.push({
        projectId: project.id,
        projectName: project.name,
        oldCode: project.code || '(なし)',
        newCode,
        tasks
      });
    }

    // 4. 変更内容の表示
    console.log('\n\n📋 変更内容:');
    console.log('─'.repeat(60));

    if (updates.length === 0) {
      console.log('  変更なし（全プロジェクトにコードが設定済み）');
      console.log('  → --force オプションで上書き可能');
      process.exit(0);
      return;
    }

    for (const update of updates) {
      console.log(`\n  プロジェクト: ${update.projectName}`);
      console.log(`    コード: ${update.oldCode} → ${update.newCode}`);
      update.tasks.forEach(t => {
        console.log(`    タスク「${t.name}」: サブコード → ${t.subCode}`);
      });
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`  合計: ${updates.length}件のプロジェクトを更新`);

    // 5. Dry-run の場合はここで終了
    if (isDryRun) {
      console.log('\n⚠️  プレビューモードです。実際に登録するには --dry-run を外して実行してください。');
      process.exit(0);
      return;
    }

    // 6. Firestoreに書き込み
    console.log('\n🔄 Firestoreに書き込み中...');

    // Firestoreバッチは最大500操作なのでチャンクに分割
    const chunkSize = 500;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const batch = db.batch();

      for (const update of chunk) {
        const ref = db.collection('projects').doc(update.projectId);
        batch.update(ref, {
          code: update.newCode,
          tasks: update.tasks,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();
      console.log(`  バッチ ${Math.floor(i / chunkSize) + 1}: ${chunk.length}件完了`);
    }

    console.log('\n✅ プロジェクトコードの一括登録が完了しました！');
    console.log('\n📌 確認方法:');
    console.log('  - プロジェクト管理画面でコードを確認できます');
    console.log('  - 時間登録画面のドロップダウンにコードが表示されます');
    console.log('  - レポートのCSVエクスポートにコードが含まれます');

  } catch (error) {
    console.error('エラー:', error);
  }

  process.exit(0);
}

registerProjectCodes();
