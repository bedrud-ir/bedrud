package models

import "testing"

func TestPasskey_TableName(t *testing.T) {
	p := Passkey{}
	if p.TableName() != "passkeys" {
		t.Fatalf("expected 'passkeys', got '%s'", p.TableName())
	}
}

func TestBlockedRefreshToken_TableName(t *testing.T) {
	b := BlockedRefreshToken{}
	if b.TableName() != "blocked_refresh_tokens" {
		t.Fatalf("expected 'blocked_refresh_tokens', got '%s'", b.TableName())
	}
}
