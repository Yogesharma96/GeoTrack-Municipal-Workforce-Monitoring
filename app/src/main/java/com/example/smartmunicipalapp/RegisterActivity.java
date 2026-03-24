package com.example.smartmunicipalapp;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class RegisterActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        EditText etRegUsername = findViewById(R.id.etRegUsername);
        EditText etRegMobile = findViewById(R.id.etRegMobile);
        EditText etRegOtp = findViewById(R.id.etRegOtp);
        EditText etRegPassword = findViewById(R.id.etRegPassword);
        EditText etRegConfirmPassword = findViewById(R.id.etRegConfirmPassword);
        Button btnSubmitRegister = findViewById(R.id.btnSubmitRegister);

        btnSubmitRegister.setOnClickListener(v -> {
            String username = etRegUsername.getText().toString().trim();
            String mobile = etRegMobile.getText().toString().trim();
            String otp = etRegOtp.getText().toString().trim();
            String password = etRegPassword.getText().toString().trim();
            String confirmPassword = etRegConfirmPassword.getText().toString().trim();

            if (username.isEmpty() || mobile.isEmpty() || otp.isEmpty() || password.isEmpty() || confirmPassword.isEmpty()) {
                Toast.makeText(RegisterActivity.this, getString(R.string.error_empty_fields), Toast.LENGTH_SHORT).show();
            } else if (!password.equals(confirmPassword)) {
                Toast.makeText(RegisterActivity.this, "Passwords do not match", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(RegisterActivity.this, getString(R.string.success_register), Toast.LENGTH_SHORT).show();
                Intent intent = new Intent(RegisterActivity.this, LoginActivity.class);
                startActivity(intent);
                finish();
            }
        });
    }
}
