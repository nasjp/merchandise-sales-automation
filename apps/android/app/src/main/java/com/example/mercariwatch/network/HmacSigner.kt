package com.example.mercariwatch.network

import java.nio.charset.StandardCharsets
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class HmacSigner {
  fun sign(secret: String, timestamp: String, rawBody: String): String {
    val mac = Mac.getInstance("HmacSHA256")
    val key = SecretKeySpec(secret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256")
    mac.init(key)
    val bytes = mac.doFinal("$timestamp.$rawBody".toByteArray(StandardCharsets.UTF_8))
    return bytes.joinToString(separator = "") { byte ->
      "%02x".format(byte.toInt() and 0xff)
    }
  }
}
