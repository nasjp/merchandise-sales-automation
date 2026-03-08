package com.example.mercariwatch.settings

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mercariwatch.R

class SettingsActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_settings)

    val endpointEdit = findViewById<EditText>(R.id.endpointEdit)
    val secretEdit = findViewById<EditText>(R.id.secretEdit)
    val saveButton = findViewById<Button>(R.id.saveButton)

    val store = SettingsStore(this)
    val current = store.load()

    endpointEdit.setText(current.endpoint)
    secretEdit.setText(current.secret)

    saveButton.setOnClickListener {
      store.save(
        IngestSettings(
          endpoint = endpointEdit.text.toString(),
          secret = secretEdit.text.toString(),
        ),
      )

      Toast.makeText(this, R.string.saved, Toast.LENGTH_SHORT).show()
      finish()
    }
  }
}
