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
    val parts = linkedSetOf<String>()

    val text = extras?.getCharSequence(Notification.EXTRA_TEXT)
      ?.toString()
      ?.trim()
      .orEmpty()
    if (text.isNotBlank()) {
      parts.add(text)
    }

    val bigText = extras?.getCharSequence(Notification.EXTRA_BIG_TEXT)
      ?.toString()
      ?.trim()
      .orEmpty()
    if (bigText.isNotBlank()) {
      parts.add(bigText)
    }

    val textLines = extras
      ?.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
      ?.mapNotNull { line ->
        line?.toString()?.trim()?.takeIf { it.isNotBlank() }
      }
      .orEmpty()
    for (line in textLines) {
      parts.add(line)
    }

    return parts.joinToString("\n")
  }

  companion object {
    private const val MERCARI_PACKAGE_NAME = "com.mercari"
  }
}
