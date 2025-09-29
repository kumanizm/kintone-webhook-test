# Vercel × kintone Webhook Logger
検証用に、kintone からの Webhook を受けて Vercel の関数ログに payload を流すだけの最小構成です。
//
## デプロイ
1. Vercel で新規プロジェクトを作成（"Other" テンプレ or 空リポ）。
2. このリポの `api/kintone-webhook.ts` を配置してデプロイ。
3. （任意）署名を使う場合、プロジェクトの Environment Variables に `KINTONE_WEBHOOK_SECRET` を追加。
4. デプロイ後の URL: `https://<your-app>.vercel.app/api/kintone-webhook`
//
## kintone 側の設定
- Webhook の URL に上記を指定。
- コンテンツタイプ: `application/json`
- （任意）Webhook トークンを設定した場合は `X-Cybozu-Webhook-Signature` ヘッダが付与されます。
//
## 動作確認
- `GET https://<your-app>.vercel.app/api/kintone-webhook` → health check (200)
- `POST` テスト（任意の JSON）:
```bash
curl -X POST \
-H "Content-Type: application/json" \
-d '{"hello":"kintone"}' \
https://<your-app>.vercel.app/api/kintone-webhook
```
- ログは Vercel ダッシュボードの *Functions* タブ or CLI: `vercel logs <your-app>` に出力されます。
//
## 注意
- 署名検証は簡易実装です。厳密に検証したい場合は Edge Function で `Request.arrayBuffer()` の raw body に対して HMAC を計算してください。
