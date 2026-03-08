package com.example.mercariwatch.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.mercariwatch.network.HmacSigner
import com.example.mercariwatch.network.IngestApi
import com.example.mercariwatch.network.IngestSendResult
import com.example.mercariwatch.settings.SettingsStore

class ForwardNotificationWorker(
  appContext: Context,
  workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
  override suspend fun doWork(): Result {
    val payload = ForwardNotificationWork.readPayload(inputData)
      ?: return Result.failure()

    val settings = SettingsStore(applicationContext).load()
    if (settings.endpoint.isBlank() || settings.secret.isBlank()) {
      return Result.failure()
    }

    val api = IngestApi(
      signer = HmacSigner(),
    )

    val sendResult = api.send(
      endpoint = settings.endpoint,
      secret = settings.secret,
      payload = payload,
      timestamp = System.currentTimeMillis().toString(),
    )

    return when (sendResult) {
      IngestSendResult.SUCCESS -> Result.success()
      IngestSendResult.PERMANENT_FAILURE -> Result.failure()
      IngestSendResult.RETRYABLE_FAILURE -> {
        if (runAttemptCount >= MAX_RETRY_ATTEMPTS) {
          Result.failure()
        } else {
          Result.retry()
        }
      }
    }
  }

  companion object {
    private const val MAX_RETRY_ATTEMPTS = 3
  }
}
