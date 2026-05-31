# 部活動懇親会アンケートシステム

部活動グループのメンバーが参加形式を選択するWebアプリです。

## セットアップ手順

### 1. Cloudflare KV ネームスペースを作成

```bash
npx wrangler kv:namespace create "KV"
npx wrangler kv:namespace create "KV" --preview
```

出力された `id` と `preview_id` を `wrangler.toml` に貼り付けてください。

### 2. 環境変数を Cloudflare に設定

Cloudflare ダッシュボード → Pages → line-survey → Settings → Environment variables で以下を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `ADMIN_PASSWORD` | 任意のパスワード | 管理者ログイン用（数字4桁など） |
| `ENCRYPTION_KEY` | 下記コマンドで生成 | メンバーリスト暗号化キー（Base64, 32バイト） |

**暗号化キーの生成（ターミナル）:**
```bash
node -e "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'))"
# または
openssl rand -base64 32
```

### 3. GitHub リポジトリ作成 → Cloudflare Pages に接続

1. GitHub に新しいリポジトリを作成してプッシュ
2. Cloudflare ダッシュボード → Pages → "Connect to Git"
3. リポジトリを選択、ビルド設定は空欄のまま（静的ファイルのみ）

### 4. ローカル開発

```bash
npm install
npm run dev
```

## 使い方

### 管理者
1. `/admin` にアクセスしてパスワードを入力
2. **メンバー**タブ：参加者の名前を1行1人で入力して保存
3. **イベント作成**タブ：イベント名・日程・参加費を入力して作成
4. 作成されたURLをLINEグループに貼り付ける
5. **イベント一覧**タブ：詳細ボタンで回答状況・合計金額を確認

### メンバー
1. LINEグループに貼られたURLにアクセス
2. 自分の名前をタップ
3. 参加形式（父・母・子・参加しない）を選択
4. 自動保存される

## ファイル構成

```
public/
  admin.html      管理者画面
  event.html      イベント回答画面
  _redirects      URLルーティング設定
functions/
  _shared.js      共通ユーティリティ（暗号化・認証）
  api/
    admin/
      login.js          ログイン認証
      members.js        メンバーリスト管理
      events/
        index.js        イベント一覧・作成
        [id].js         イベント詳細（管理者用）
    events/
      [id].js           イベント取得・回答保存（公開）
```
