package com.example.mercariwatch.notification

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.example.mercariwatch.model.AndroidIngestPayload
import com.example.mercariwatch.settings.SettingsStore
import com.example.mercariwatch.work.ForwardNotificationWork
import java.time.Instant

class MercariNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val target = sbn ?: return
    if (target.packageName != MERCARI_PACKAGE_NAME) {
      return
    }

    val settings = SettingsStore(this).load()
    if (settings.endpoint.isBlank() || settings.secret.isBlank()) {
      return
    }

    val title = target.notification.extractTitle()
    val body = target.notification.extractBody()

    if (title.isBlank() && body.isBlank()) {
      return
    }

    val notificationId = target.key
      ?: "${target.packageName}-${target.postTime}"

    ForwardNotificationWork.enqueue(
      context = applicationContext,
      payload = AndroidIngestPayload(
        notificationId = notificationId,
        title = title,
        body = body,
        receivedAt = Instant.now().toString(),
        sourcePackage = target.packageName,
      ),
    )
  }

  private fun Notification.extractTitle(): String {
    return extras?.getCharSequence(Notification.EXTRA_TITLE)
      ?.toString()
      ?.trim()
      .orEmpty()
  }

  private fun Notification.extractBody(): String {
    val text = extras?.getCharSequence(Notification.EXTRA_TEXT)
      ?: extras?.getCharSequence(Notification.EXTRA_BIG_TEXT)

    return text?.toString()?.trim().orEmpty()
  }

  companion object {
    private const val MERCARI_PACKAGE_NAME = "com.mercari"
  }
}
