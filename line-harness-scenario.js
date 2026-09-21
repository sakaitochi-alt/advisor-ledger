/**
 * LINE Harness シナリオ自動構成スクリプト
 * 岩国市立石町4丁目 売買土地 1,480万円
 *
 * 事前準備：
 * 1. LINE Harness APIのベースURLを環境変数に設定
 * 2. APIトークン（workspace token）を環境変数に設定
 */

const axios = require('axios');

// 設定
const config = {
  baseURL: process.env.LINE_HARNESS_API_URL || 'http://localhost:3000/api',
  token: process.env.LINE_HARNESS_API_TOKEN,
  accountId: '2011673077',
  workspaceId: '1f08753e8b48',
};

// 物件情報
const property = {
  name: '岩国市立石町4丁目 売買土地',
  price: '1,480万円',
  url: 'https://www.sakaitochi.co.jp/sale/detail/350056-552',
  manager: '古藤',
  company: 'サカイ土地株式会社',
  businessHours: '10:00-17:00',
  closedDays: ['水曜日', '第3日曜日', '祝日'],
};

// API client
const client = axios.create({
  baseURL: config.baseURL,
  headers: {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json',
  },
});

/**
 * シナリオ作成
 */
async function createScenario() {
  try {
    console.log('📝 シナリオ作成中...');

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
    console.log(`✅ シナリオ作成完了: ${scenarioId}`);

    return scenarioId;
  } catch (error) {
    console.error('❌ シナリオ作成失敗:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * ステップ追加：初期メッセージ
 */
async function addInitialMessage(scenarioId) {
  try {
    console.log('📬 初期メッセージステップ追加中...');

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

    console.log(`✅ 初期メッセージステップ追加: ${step.data.id}`);
    return step.data.id;
  } catch (error) {
    console.error('❌ 初期メッセージステップ追加失敗:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 分岐処理：資料リクエスト
 */
async function addMaterialBranch(scenarioId) {
  try {
    console.log('📎 資料リクエスト分岐追加中...');

    // 条件分岐ステップ
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

    // 資料リンク送信ステップ
    const message = await client.post(`/scenarios/${scenarioId}/steps`, {
      order: 3,
      type: 'message',
      parentStepId: condition.data.id,
      content: {
        type: 'text',
        text: `${property.name}\n\n📄 物件資料\n${property.url}\n\nご不明な点はお気軽にお問い合わせください。\n担当: ${property.manager}\n${property.company}`,
      },
    });

    console.log(`✅ 資料リクエスト分岐追加`);
  } catch (error) {
    console.error('❌ 資料リクエスト分岐追加失敗:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 分岐処理：日時選択フォーム（見学・相談）
 */
async function addReservationBranch(scenarioId) {
  try {
    console.log('📅 日時選択分岐追加中...');

    // 見学リクエスト条件
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

    // 相談リクエスト条件
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

    // フォーム送信ステップ（見学）
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
        redirectUrl: `${property.url}?reserved=true`,
      },
    });

    // フォーム送信ステップ（相談）
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
        redirectUrl: `${property.url}?consulted=true`,
      },
    });

    console.log(`✅ 日時選択分岐追加`);
  } catch (error) {
    console.error('❌ 日時選択分岐追加失敗:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log(`\n🚀 LINE Harnessシナリオ自動構成開始\n`);
    console.log(`物件: ${property.name} ${property.price}`);
    console.log(`担当: ${property.manager}\n`);

    if (!config.token) {
      throw new Error('LINE_HARNESS_API_TOKEN 環境変数が設定されていません');
    }

    // 1. シナリオ作成
    const scenarioId = await createScenario();

    // 2. 初期メッセージ追加
    await addInitialMessage(scenarioId);

    // 3. 分岐処理追加
    await addMaterialBranch(scenarioId);
    await addReservationBranch(scenarioId);

    console.log(`\n✨ シナリオ構成完了\n`);
    console.log(`シナリオID: ${scenarioId}`);
    console.log(`\n次のステップ:`);
    console.log(`1. LINE Harnessダッシュボードでシナリオを確認`);
    console.log(`2. LINE Official Accountにシナリオを関連付け`);
    console.log(`3. テスト配信を実施`);

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
