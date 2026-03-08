package com.example.mercariwatch.network

import org.junit.Assert.assertEquals
import org.junit.Test

class HmacSignerTest {
  @Test
  fun sign_isDeterministic() {
    val signer = HmacSigner()
    val actual = signer.sign(
      secret = "secret",
      timestamp = "1700000000000",
      rawBody = "{\"hello\":\"world\"}",
    )

    assertEquals(
      "e79013a0f6c0b0954bb016ad530f0f304eb5aa84ec27788ef1314c57cbf8d678",
      actual,
    )
  }
}
