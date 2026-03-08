package com.example.mercariwatch.model

data class AndroidIngestPayload(
  val notificationId: String,
  val title: String,
  val body: String,
  val receivedAt: String,
  val sourcePackage: String,
)
