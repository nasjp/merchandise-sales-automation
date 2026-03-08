package com.example.mercariwatch.work

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.OutOfQuotaPolicy
import com.example.mercariwatch.model.AndroidIngestPayload
import java.util.concurrent.TimeUnit

object ForwardNotificationWork {
  private const val KEY_NOTIFICATION_ID = "notification_id"
  private const val KEY_TITLE = "title"
  private const val KEY_BODY = "body"
  private const val KEY_RECEIVED_AT = "received_at"
  private const val KEY_SOURCE_PACKAGE = "source_package"

  fun enqueue(context: Context, payload: AndroidIngestPayload) {
    val data = Data.Builder()
      .putString(KEY_NOTIFICATION_ID, payload.notificationId)
      .putString(KEY_TITLE, payload.title)
      .putString(KEY_BODY, payload.body)
      .putString(KEY_RECEIVED_AT, payload.receivedAt)
      .putString(KEY_SOURCE_PACKAGE, payload.sourcePackage)
      .build()

    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()

    val request = OneTimeWorkRequestBuilder<ForwardNotificationWorker>()
      .setInputData(data)
      .setConstraints(constraints)
      .setBackoffCriteria(BackoffPolicy.LINEAR, 30, TimeUnit.SECONDS)
      .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
      .build()

    WorkManager.getInstance(context)
      .enqueueUniqueWork(
        uniqueWorkName(payload.notificationId),
        ExistingWorkPolicy.KEEP,
        request,
      )
  }

  fun readPayload(data: Data): AndroidIngestPayload? {
    val notificationId = data.getString(KEY_NOTIFICATION_ID)?.trim().orEmpty()
    val title = data.getString(KEY_TITLE)?.trim().orEmpty()
    val body = data.getString(KEY_BODY)?.trim().orEmpty()
    val receivedAt = data.getString(KEY_RECEIVED_AT)?.trim().orEmpty()
    val sourcePackage = data.getString(KEY_SOURCE_PACKAGE)?.trim().orEmpty()

    if (notificationId.isBlank() || receivedAt.isBlank() || sourcePackage.isBlank()) {
      return null
    }

    if (title.isBlank() && body.isBlank()) {
      return null
    }

    return AndroidIngestPayload(
      notificationId = notificationId,
      title = title,
      body = body,
      receivedAt = receivedAt,
      sourcePackage = sourcePackage,
    )
  }

  private fun uniqueWorkName(notificationId: String): String {
    return "mercari-forward-$notificationId"
  }
}
