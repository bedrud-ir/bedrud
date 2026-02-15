package utils

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGenerateSelfSignedCert_Success(t *testing.T) {
	tmpDir := t.TempDir()
	certFile := filepath.Join(tmpDir, "cert.pem")
	keyFile := filepath.Join(tmpDir, "key.pem")

	err := GenerateSelfSignedCert(certFile, keyFile)
	if err != nil {
		t.Fatalf("failed to generate cert: %v", err)
	}

	// Verify cert file exists and is non-empty
	certInfo, err := os.Stat(certFile)
	if err != nil {
		t.Fatalf("cert file not created: %v", err)
	}
	if certInfo.Size() == 0 {
		t.Fatal("cert file is empty")
	}

	// Verify key file exists and is non-empty
	keyInfo, err := os.Stat(keyFile)
	if err != nil {
		t.Fatalf("key file not created: %v", err)
	}
	if keyInfo.Size() == 0 {
		t.Fatal("key file is empty")
	}
}

func TestGenerateSelfSignedCert_CertContainsPEM(t *testing.T) {
	tmpDir := t.TempDir()
	certFile := filepath.Join(tmpDir, "cert.pem")
	keyFile := filepath.Join(tmpDir, "key.pem")

	_ = GenerateSelfSignedCert(certFile, keyFile)

	certData, _ := os.ReadFile(certFile)
	if !containsSubstring(string(certData), "BEGIN CERTIFICATE") {
		t.Fatal("cert file doesn't contain PEM certificate")
	}
	if !containsSubstring(string(certData), "END CERTIFICATE") {
		t.Fatal("cert file doesn't contain end marker")
	}
}

func TestGenerateSelfSignedCert_KeyContainsPEM(t *testing.T) {
	tmpDir := t.TempDir()
	certFile := filepath.Join(tmpDir, "cert.pem")
	keyFile := filepath.Join(tmpDir, "key.pem")

	_ = GenerateSelfSignedCert(certFile, keyFile)

	keyData, _ := os.ReadFile(keyFile)
	if !containsSubstring(string(keyData), "BEGIN EC PRIVATE KEY") {
		t.Fatal("key file doesn't contain EC private key")
	}
}

func TestGenerateSelfSignedCert_InvalidCertPath(t *testing.T) {
	keyFile := filepath.Join(t.TempDir(), "key.pem")
	err := GenerateSelfSignedCert("/nonexistent/path/cert.pem", keyFile)
	if err == nil {
		t.Fatal("expected error for invalid cert path")
	}
}

func TestGenerateSelfSignedCert_InvalidKeyPath(t *testing.T) {
	certFile := filepath.Join(t.TempDir(), "cert.pem")
	err := GenerateSelfSignedCert(certFile, "/nonexistent/path/key.pem")
	if err == nil {
		t.Fatal("expected error for invalid key path")
	}
}

func TestGenerateSelfSignedCert_MultipleGenerations(t *testing.T) {
	tmpDir := t.TempDir()
	cert1 := filepath.Join(tmpDir, "cert1.pem")
	key1 := filepath.Join(tmpDir, "key1.pem")
	cert2 := filepath.Join(tmpDir, "cert2.pem")
	key2 := filepath.Join(tmpDir, "key2.pem")

	_ = GenerateSelfSignedCert(cert1, key1)
	_ = GenerateSelfSignedCert(cert2, key2)

	data1, _ := os.ReadFile(cert1)
	data2, _ := os.ReadFile(cert2)

	// Different certs should be generated each time (different serial numbers, keys)
	if string(data1) == string(data2) {
		t.Fatal("expected different certificates for each generation")
	}
}

func containsSubstring(s, substr string) bool {
	return len(s) >= len(substr) && findSubstring(s, substr)
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
