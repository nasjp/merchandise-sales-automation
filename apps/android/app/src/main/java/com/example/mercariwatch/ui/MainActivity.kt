package com.example.mercariwatch.ui

import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.mercariwatch.R
import com.example.mercariwatch.notification.MercariNotificationListenerService
import com.example.mercariwatch.settings.SettingsActivity

class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    val openNotificationSettingsButton = findViewById<Button>(R.id.openNotificationSettingsButton)
    val openIngestSettingsButton = findViewById<Button>(R.id.openIngestSettingsButton)

    openNotificationSettingsButton.setOnClickListener {
      startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
    }

    openIngestSettingsButton.setOnClickListener {
      startActivity(Intent(this, SettingsActivity::class.java))
    }
  }

  override fun onResume() {
    super.onResume()
    updateListenerStatus()
  }

  private fun updateListenerStatus() {
    val textView = findViewById<TextView>(R.id.listenerStatusText)
    val enabled = isNotificationListenerEnabled()

    textView.text = if (enabled) {
      getString(R.string.listener_enabled)
    } else {
      getString(R.string.listener_disabled)
    }
  }

  private fun isNotificationListenerEnabled(): Boolean {
    val enabledListeners = Settings.Secure.getString(
      contentResolver,
      "enabled_notification_listeners",
    ) ?: return false

    val component = ComponentName(this, MercariNotificationListenerService::class.java)
    return enabledListeners.contains(component.flattenToString())
  }
}
