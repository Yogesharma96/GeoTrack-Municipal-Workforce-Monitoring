package com.example.smartmunicipalapp;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class LoginActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        EditText etLoginUsername = findViewById(R.id.etLoginUsername);
        EditText etLoginPassword = findViewById(R.id.etLoginPassword);
        Button btnSubmitLogin = findViewById(R.id.btnSubmitLogin);

        btnSubmitLogin.setOnClickListener(v -> {
            String username = etLoginUsername.getText().toString().trim();
            String password = etLoginPassword.getText().toString().trim();

            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(LoginActivity.this, getString(R.string.error_empty_fields), Toast.LENGTH_SHORT).show();
            } else {
                // Basic check for demonstration
                if (username.equals("admin") && password.equals("admin") || (!username.isEmpty() && !password.isEmpty())) {
                    Intent intent = new Intent(LoginActivity.this, DashboardActivity.class);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(LoginActivity.this, getString(R.string.error_invalid_credentials), Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
