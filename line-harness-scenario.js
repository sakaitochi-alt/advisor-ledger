#!/usr/bin/env node
/**
 * LINE Harness シナリオ自動構成スクリプト（対話型）
 * CLIで対話的に設定を行い、LINE Harnessにシナリオを自動生成
 *
 * 使用方法：
 *   node line-harness-scenario.js
 */

const axios = require('axios');
const readline = require('readline');

// 対話型インターフェース
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ユーザー入力を受け付ける関数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// 出力ヘルパー
function log(message, type = 'info') {
  const icons = {
    info: 'ℹ️ ',
    success: '✅ ',
    error: '❌ ',
    warning: '⚠️ ',
    input: '📝 ',
    check: '📋 ',
  };
  console.log(`${icons[type] || ''} ${message}`);
}

function logSection(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}\n`);
}

// グローバル設定
let config = {
  baseURL: null,
  token: null,
  accountId: '2011673077',
  workspaceId: '1f08753e8b48',
};

let property = {
  name: '岩国市立石町4丁目 売買土地',
  price: '1,480万円',
  url: 'https://www.sakaitochi.co.jp/sale/detail/350056-552',
  manager: '古藤',
  company: 'サカイ土地株式会社',
  businessHours: '10:00-17:00',
  closedDays: ['水曜日', '第3日曜日', '祝日'],
};

let client = null;

/**
 * API接続テスト
 */
async function testConnection() {
  try {
    log('LINE Harness APIへ接続中...', 'info');
    await client.get('/health');
    log('API接続確認完了', 'success');
    return true;
  } catch (error) {
    log(`API接続失敗: ${error.message}`, 'error');
    log('以下を確認してください:', 'warning');
    log('  1. LINE Harness インスタンスが起動しているか', 'info');
    log('  2. APIベースURLが正しいか', 'info');
    log('  3. APIトークンが有効か', 'info');
    return false;
  }
}

/**
 * 設定入力フェーズ
 */
async function setupPhase() {
  logSection('📋 LINE Harness 接続設定');

  // API URLの入力
  const defaultUrl = process.env.LINE_HARNESS_API_URL || 'http://localhost:3000/api';
  const urlInput = await question(`API Base URL [${defaultUrl}]: `);
  config.baseURL = urlInput || defaultUrl;

  // APIトークンの入力
  const tokenInput = await question('API Token: ');
  if (!tokenInput) {
    log('APIトークンは必須です', 'error');
    process.exit(1);
  }
  config.token = tokenInput;

  // ワークスペースID確認
  const wsIdInput = await question(`Workspace ID [${config.workspaceId}]: `);
  if (wsIdInput) config.workspaceId = wsIdInput;

  // アカウントID確認
  const acIdInput = await question(`Account ID [${config.accountId}]: `);
  if (acIdInput) config.accountId = acIdInput;

  // APIクライアント初期化
  client = axios.create({
    baseURL: config.baseURL,
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  return await testConnection();
}

/**
 * 物件情報編集フェーズ
 */
async function propertyPhase() {
  logSection('🏢 物件情報確認・編集');

  console.log('現在の物件情報：');
  console.log(`  名称: ${property.name}`);
  console.log(`  価格: ${property.price}`);
  console.log(`  URL: ${property.url}`);
  console.log(`  担当: ${property.manager}`);
  console.log(`  会社: ${property.company}`);
  console.log();

  const edit = await question('物件情報を編集しますか？ (y/n) [n]: ');

  if (edit.toLowerCase() === 'y') {
    const name = await question(`物件名 [${property.name}]: `);
    if (name) property.name = name;

    const price = await question(`価格 [${property.price}]: `);
    if (price) property.price = price;

    const url = await question(`URL [${property.url}]: `);
    if (url) property.url = url;

    const manager = await question(`担当者 [${property.manager}]: `);
    if (manager) property.manager = manager;

    const company = await question(`会社名 [${property.company}]: `);
    if (company) property.company = company;
  }
}

/**
 * シナリオプレビューフェーズ
 */
async function previewPhase() {
  logSection('📑 シナリオプレビュー');

  console.log(`\n【初期メッセージ】`);
  console.log(`"${property.name}へのお問い合わせありがとうございます"`);
  console.log(`\n【ボタンオプション】`);
  console.log(`  1️⃣  物件資料がほしい`);
  console.log(`  2️⃣  実際に見てみたい`);
  console.log(`  3️⃣  店舗で相談したい`);

  console.log(`\n【分岐1：物件資料】`);
  console.log(`  → 資料リンク送信: ${property.url}`);

  console.log(`\n【分岐2・3：日時選択】`);
  console.log(`  営業時間: ${property.businessHours}`);
  console.log(`  営業日: 月〜土（${property.closedDays.join('・')}は休み）`);
  console.log(`  フォーム入力: 日時・氏名・連絡先`);

  console.log(`\n【シナリオ配置先】`);
  console.log(`  Workspace ID: ${config.workspaceId}`);
  console.log(`  Account ID: ${config.accountId}`);
  console.log();

  const confirm = await question('このシナリオで実装しますか？ (y/n) [y]: ');
  return confirm.toLowerCase() !== 'n';
}

/**
 * シナリオ作成
 */
async function createScenario() {
  try {
    log('シナリオ作成中...', 'info');

    const scenario = await client.post('/scenarios', {
      workspaceId: config.workspaceId,
      name: `${property.name} 自動応答`,
      description: `${property.name} ${property.price} の友達追加時自動応答シナリオ`,
      triggers: [
        {
          type: 'follow',
          enabled: true,
        },
      ],
    });

    const scenarioId = scenario.data.id;
    log(`シナリオ作成完了: ${scenarioId}`, 'success');
    return scenarioId;
  } catch (error) {
    log(`シナリオ作成失敗: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

/**
 * ステップ追加：初期メッセージ
 */
async function addInitialMessage(scenarioId) {
  try {
    log('初期メッセージステップ追加中...', 'info');

    const step = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 1,
      type: 'message',
      delay: 0,
      content: {
        type: 'template',
        template: {
          type: 'buttons',
          text: `【${property.name}】へのお問い合わせありがとうございます`,
          actions: [
            {
              type: 'postback',
              label: '物件資料がほしい',
              data: 'action=request_material',
            },
            {
              type: 'postback',
              label: '実際に見てみたい',
              data: 'action=request_viewing',
            },
            {
              type: 'postback',
              label: '店舗で相談したい',
              data: 'action=request_consultation',
            },
          ],
        },
      },
    });

    log('初期メッセージステップ追加完了', 'success');
    return step.data.id;
  } catch (error) {
    log(`初期メッセージ追加失敗: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

/**
 * 分岐処理：資料リクエスト
 */
async function addMaterialBranch(scenarioId) {
  try {
    log('資料リクエスト分岐追加中...', 'info');

    const condition = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 2,
      type: 'condition',
      conditions: [
        {
          type: 'postback_data',
          key: 'action',
          value: 'request_material',
        },
      ],
    });

    const message = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 3,
      type: 'message',
      parentStepId: condition.data.id,
      content: {
        type: 'text',
        text: `${property.name}\n\n📄 物件資料\n${property.url}\n\nご不明な点はお気軽にお問い合わせください。\n担当: ${property.manager}\n${property.company}`,
      },
    });

    log('資料リクエスト分岐追加完了', 'success');
  } catch (error) {
    log(`資料分岐追加失敗: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

/**
 * 分岐処理：日時選択フォーム
 */
async function addReservationBranch(scenarioId) {
  try {
    log('日時選択分岐追加中...', 'info');

    const viewingCondition = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 4,
      type: 'condition',
      conditions: [
        {
          type: 'postback_data',
          key: 'action',
          value: 'request_viewing',
        },
      ],
    });

    const consultationCondition = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 5,
      type: 'condition',
      conditions: [
        {
          type: 'postback_data',
          key: 'action',
          value: 'request_consultation',
        },
      ],
    });

    const viewingForm = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 6,
      type: 'form',
      parentStepId: viewingCondition.data.id,
      formConfig: {
        title: '物件見学予約',
        description: `${property.name} の見学をご予約ください`,
        fields: [
          {
            type: 'date',
            name: 'visit_date',
            label: '希望日時',
            required: true,
            allowedDaysOfWeek: ['月', '火', '木', '金', '土'],
            businessHours: {
              start: '10:00',
              end: '17:00',
              closedDays: property.closedDays,
            },
          },
          {
            type: 'text',
            name: 'visitor_name',
            label: 'お名前',
            required: true,
          },
          {
            type: 'tel',
            name: 'phone',
            label: 'ご連絡先',
            required: true,
          },
        ],
      },
    });

    const consultationForm = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 7,
      type: 'form',
      parentStepId: consultationCondition.data.id,
      formConfig: {
        title: '店舗相談予約',
        description: `${property.company} での相談をご予約ください`,
        fields: [
          {
            type: 'date',
            name: 'visit_date',
            label: '希望日時',
            required: true,
            allowedDaysOfWeek: ['月', '火', '木', '金', '土'],
            businessHours: {
              start: '10:00',
              end: '17:00',
              closedDays: property.closedDays,
            },
          },
          {
            type: 'text',
            name: 'visitor_name',
            label: 'お名前',
            required: true,
          },
          {
            type: 'tel',
            name: 'phone',
            label: 'ご連絡先',
            required: true,
          },
          {
            type: 'textarea',
            name: 'inquiry',
            label: 'ご質問・ご要望',
          },
        ],
      },
    });

    log('日時選択分岐追加完了', 'success');
  } catch (error) {
    log(`日時選択分岐追加失敗: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.clear();
    logSection('🚀 LINE Harness シナリオ自動構成');

    // ステップ1: 接続設定
    const connected = await setupPhase();
    if (!connected) {
      process.exit(1);
    }

    // ステップ2: 物件情報
    await propertyPhase();

    // ステップ3: プレビュー
    const proceed = await previewPhase();
    if (!proceed) {
      log('キャンセルされました', 'warning');
      rl.close();
      process.exit(0);
    }

    // ステップ4: 実装
    logSection('⚙️  シナリオ実装中');
    const scenarioId = await createScenario();
    await addInitialMessage(scenarioId);
    await addMaterialBranch(scenarioId);
    await addReservationBranch(scenarioId);

    // 完了
    logSection('✨ 実装完了');
    log(`シナリオID: ${scenarioId}`, 'success');
    console.log('\n次のステップ:');
    console.log('  1. LINE Harnessダッシュボードでシナリオを確認');
    console.log('  2. LINE Official Accountに関連付け');
    console.log('  3. テスト配信を実施\n');

    rl.close();
  } catch (error) {
    log(`エラーが発生しました: ${error.message}`, 'error');
    rl.close();
    process.exit(1);
  }
}

main();
