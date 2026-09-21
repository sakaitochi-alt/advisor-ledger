# LINE Harness シナリオ自動構成ガイド

## 対象物件
- 名称：岩国市立石町4丁目 売買土地
- 価格：1,480万円
- URL：https://www.sakaitochi.co.jp/sale/detail/350056-552
- 担当：古藤（サカイ土地株式会社）

---

## 前提条件

### 1. LINE Harness インスタンスの準備
- [LINE Harness OSS](https://github.com/Shudesu/line-harness-oss)がセットアップ済みか確認
- または、クラウド版LINE Harnessの契約

### 2. LINE Official Accountの準備
- LINE Official Account作成済み
- LINE Messaging APIの有効化
- Channel Access Token取得済み

### 3. 必要な認証情報

| 項目 | 取得方法 |
|------|---------|
| ワークスペースID | `1f08753e8b48`（既存） |
| アカウントID | `2011673077`（既存） |
| LINE Harness APIトークン | LINE Harnessダッシュボード → 設定 → API |
| LINE Harness APIベースURL | `http://localhost:3000/api`（自ホスト）または提供URL |

---

## セットアップ手順

### ステップ1：環境変数の設定

```bash
# .env または実行前に設定
export LINE_HARNESS_API_URL="http://localhost:3000/api"  # または提供のAPI URL
export LINE_HARNESS_API_TOKEN="your-workspace-api-token"
```

### ステップ2：依存パッケージのインストール

```bash
npm install axios dotenv
```

### ステップ3：スクリプト実行

```bash
node line-harness-scenario.js
```

---

## スクリプト実行結果

実行後、以下のフローが自動生成されます：

### 初期状態フロー
```
友だち追加
↓
「【岩国市立石町4丁目 売買土地】へのお問い合わせありがとうございます」
+ボタンテンプレート（3択）
```

### 分岐1：物件資料がほしい
```
ユーザー選択
↓
資料リンク送信
↓
メッセージ：「物件資料\n[URL]\nご不明な点はお気軽にお問い合わせください」
```

### 分岐2・3：見学 / 店舗相談
```
ユーザー選択
↓
LINEフォーム送信
（日時・氏名・連絡先を入力）
↓
フォーム送信後、物件詳細ページにリダイレクト
```

---

## フォーム設定詳細

### 日時選択ロジック
- **営業時間**：10:00～17:00
- **営業日**：月〜土（日曜・祝日・第3日曜除く）
- **休業日**：水曜・第3日曜・祝日

フォーム内で自動的に選択可能な日時が制限されます。

### フィールド
1. **希望日時**（日時選択）- 必須
2. **お名前**（テキスト）- 必須
3. **ご連絡先**（電話番号）- 必須
4. **ご質問・ご要望**（テキストエリア）- 相談時のみ

---

## トラブルシューティング

### APIトークンエラー
```
Error: Authorization Bearer token not found
```
→ `LINE_HARNESS_API_TOKEN` が正しく設定されているか確認

### ベースURL接続エラー
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
→ LINE Harnessインスタンスが起動しているか確認、またはAPI URLが正しいか確認

### ステップ作成失敗
```
Error: Scenario not found
```
→ ワークスペースID、アカウントIDが正しいか確認

---

## 次のステップ

### 1. シナリオの確認・調整
LINE Harnessダッシュボード → シナリオ一覧 → 自動生成されたシナリオを確認

### 2. LINE Official Accountへの関連付け
- シナリオを該当のLINE Official Accountに割り当て
- LINE Messaging API連携を確認

### 3. テスト配信
- テストユーザーで友だち追加し、各分岐を動作確認
- フォーム送信、リダイレクトが正常か確認

### 4. 本番配信
- 問題がなければシナリオを有効化
- LINE Official Account公開ページで友だち追加受付開始

---

## カスタマイズ

### メッセージテキストの編集
`line-harness-scenario.js` 内の `property` オブジェクトを編集：

```javascript
const property = {
  name: '岩国市立石町4丁目 売買土地',  // 物件名
  price: '1,480万円',                   // 価格
  url: 'https://...',                   // 詳細URL
  manager: '古藤',                      // 担当者
  company: 'サカイ土地株式会社',       // 会社名
  // ...
};
```

### 営業日・営業時間の変更
```javascript
businessHours: {
  start: '10:00',    // 開始時間
  end: '17:00',      // 終了時間
  closedDays: ['水曜日', '第3日曜日', '祝日'],
}
```

### ボタンテンプレートの追加
`addInitialMessage()` 内の `actions` 配列にボタンを追加。

---

## 参考リンク

- [LINE Harness OSS GitHub](https://github.com/Shudesu/line-harness-oss)
- [LINE Harness 使い方ガイド](https://the-harness.com/line-harness/how-to/)
- [LINE Messaging API 仕様](https://developers.line.biz/ja/docs/messaging-api/)

---

## サポート

トラブルが発生した場合：
1. LINE Harnessダッシュボード → ログを確認
2. LINE Messaging APIのエラーレスポンスを確認
3. GitHub Issues（LINE Harness）で類似の問題を検索
