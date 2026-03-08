package com.example.mercariwatch.settings

import android.content.Context

data class IngestSettings(
  val endpoint: String,
  val secret: String,
)

class SettingsStore(context: Context) {
  private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun load(): IngestSettings {
    return IngestSettings(
      endpoint = prefs.getString(KEY_ENDPOINT, "") ?: "",
      secret = prefs.getString(KEY_SECRET, "") ?: "",
    )
  }

  fun save(settings: IngestSettings) {
    prefs.edit()
      .putString(KEY_ENDPOINT, settings.endpoint.trim())
      .putString(KEY_SECRET, settings.secret.trim())
      .apply()
  }

  companion object {
    private const val PREFS_NAME = "ingest_settings"
    private const val KEY_ENDPOINT = "endpoint"
    private const val KEY_SECRET = "secret"
  }
}
