package com.example.mercariwatch.network

import com.example.mercariwatch.model.AndroidIngestPayload
import java.io.IOException
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import org.json.JSONObject

enum class IngestSendResult {
  SUCCESS,
  RETRYABLE_FAILURE,
  PERMANENT_FAILURE,
}

class IngestApi(
  private val signer: HmacSigner,
  private val client: OkHttpClient = OkHttpClient(),
) {
  fun send(
    endpoint: String,
    secret: String,
    payload: AndroidIngestPayload,
    timestamp: String,
  ): IngestSendResult {
    val url = normalizeEndpoint(endpoint) ?: return IngestSendResult.PERMANENT_FAILURE
    val body = JSONObject()
      .put("notificationId", payload.notificationId)
      .put("title", payload.title)
      .put("body", payload.body)
      .put("receivedAt", payload.receivedAt)
      .put("sourcePackage", payload.sourcePackage)
      .toString()

    val signature = signer.sign(secret, timestamp, body)

    val request = Request.Builder()
      .url(url)
      .header("content-type", "application/json")
      .header("x-ingest-timestamp", timestamp)
      .header("x-ingest-signature", signature)
      .post(body.toRequestBody("application/json".toMediaType()))
      .build()

    return try {
      client.newCall(request).execute().use { response ->
        when {
          response.isSuccessful -> IngestSendResult.SUCCESS
          response.code in listOf(429, 500, 502, 503, 504) -> IngestSendResult.RETRYABLE_FAILURE
          else -> IngestSendResult.PERMANENT_FAILURE
        }
      }
    } catch (_: IOException) {
      IngestSendResult.RETRYABLE_FAILURE
    }
  }

  private fun normalizeEndpoint(raw: String): String? {
    val trimmed = raw.trim().trimEnd('/')
    if (trimmed.isBlank()) {
      return null
    }

    val full = if (trimmed.endsWith("/api/ingest/android")) {
      trimmed
    } else {
      "$trimmed/api/ingest/android"
    }

    return full.toHttpUrlOrNull()?.toString()
  }
}
