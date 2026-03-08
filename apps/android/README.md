# @merchandise/android

Android 側は通知受信と再送制御に責務を限定します。

## 実装範囲

- `notification/MercariNotificationListenerService`
  - `com.mercari` の通知だけを対象にする
  - 端末内で SKU 判定・価格判定は行わない
- `work/ForwardNotificationWorker`
  - WorkManager で短い再送制御（LINEAR backoff 30秒, 最大3回）
- `network/IngestApi` + `network/HmacSigner`
  - `x-ingest-timestamp` / `x-ingest-signature` を付与して `apps/web` の ingest API に送信
- `settings/SettingsActivity`
  - endpoint / secret を端末保存

## 送信 payload

以下の最小項目のみ送信します。

- `notificationId`
- `title`
- `body`
- `receivedAt`
- `sourcePackage`

## 起動手順

```bash
cd apps/android
./gradlew :app:assembleDebug
```

通知アクセスを有効化し、設定画面で endpoint と secret を保存してください。
endpoint は以下のどちらでも指定できます。

- `https://<web-host>`
- `https://<web-host>/api/ingest/android`
