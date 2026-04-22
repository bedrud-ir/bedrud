package auth

import (
	"bedrud/config"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"bedrud/internal/testutil"
	"testing"
)


// testAuthConfig returns a config suitable for auth service tests
func testAuthConfig() *config.Config {
	return &config.Config{
		Auth: config.AuthConfig{
			JWTSecret:     "auth-service-test-secret-key-32b",
			TokenDuration: 1,
		},
	}
}

func setupAuthService(t *testing.T) (*AuthService, *config.Config) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)
	cfg := testAuthConfig()
	// We need to set the global config for functions that use config.Get()
	// Since config.Load uses sync.Once, we bypass it by setting the package-level var
	return svc, cfg
}

func TestAuthService_Register_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	user, err := svc.Register("test@example.com", "password123", "Test User")
	if err != nil {
		t.Fatalf("failed to register: %v", err)
	}
	if user == nil {
		t.Fatal("expected non-nil user")
	}
	if user.Email != "test@example.com" {
		t.Fatalf("expected email 'test@example.com', got '%s'", user.Email)
	}
	if user.Name != "Test User" {
		t.Fatalf("expected name 'Test User', got '%s'", user.Name)
	}
	if user.Provider != "local" {
		t.Fatal("expected provider 'local'")
	}
	if !user.IsActive {
		t.Fatal("expected IsActive to be true")
	}
	if len(user.Accesses) != 1 || user.Accesses[0] != "user" {
		t.Fatalf("expected accesses [user], got %v", user.Accesses)
	}
	// Password should be hashed, not plain
	if user.Password == "password123" {
		t.Fatal("password should be hashed")
	}
}

func TestAuthService_Register_DuplicateEmail(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	_, _ = svc.Register("dup@example.com", "password123", "First")
	_, err := svc.Register("dup@example.com", "password456", "Second")
	if err == nil {
		t.Fatal("expected error for duplicate registration")
	}
	if err.Error() != "user already exists" {
		t.Fatalf("expected 'user already exists', got '%s'", err.Error())
	}
}

func TestAuthService_GetUserByID(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	registered, _ := svc.Register("get@example.com", "pass", "Get User")

	found, err := svc.GetUserByID(registered.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find user")
	}
	if found.Email != "get@example.com" {
		t.Fatalf("unexpected email: %s", found.Email)
	}
}

func TestAuthService_GetUserByEmail(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	_, _ = svc.Register("email@example.com", "pass", "Email User")

	found, err := svc.GetUserByEmail("email@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find user")
	}
}

func TestAuthService_UpdateRefreshToken(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	user, _ := svc.Register("refresh@example.com", "pass", "Refresh User")

	err := svc.UpdateRefreshToken(user.ID, "new-refresh-token")
	if err != nil {
		t.Fatalf("failed to update refresh token: %v", err)
	}

	foundUser, _ := svc.GetUserByID(user.ID)
	if foundUser.RefreshToken != "new-refresh-token" {
		t.Fatalf("expected 'new-refresh-token', got '%s'", foundUser.RefreshToken)
	}
}

func TestAuthService_UpdateUserAccesses(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	user, _ := svc.Register("access@example.com", "pass", "Access User")

	err := svc.UpdateUserAccesses(user.ID, []string{"admin", "user"})
	if err != nil {
		t.Fatalf("failed to update accesses: %v", err)
	}

	found, _ := svc.GetUserByID(user.ID)
	if len(found.Accesses) != 2 {
		t.Fatalf("expected 2 accesses, got %d", len(found.Accesses))
	}
}

func TestAuthService_BeginRegisterPasskey(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	challenge, err := svc.BeginRegisterPasskey("user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if challenge == "" {
		t.Fatal("expected non-empty challenge")
	}
}

func TestAuthService_BeginLoginPasskey(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	challenge, err := svc.BeginLoginPasskey()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if challenge == "" {
		t.Fatal("expected non-empty challenge")
	}
}

func TestNewAuthService(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)

	svc := NewAuthService(userRepo, passkeyRepo)
	if svc == nil {
		t.Fatal("expected non-nil auth service")
	}
}

// --- Request/Response struct tests ---

func TestRegisterRequest_Fields(t *testing.T) {
	r := RegisterRequest{
		Email:    "test@example.com",
		Password: "pass123",
		Name:     "Test",
	}
	if r.Email != "test@example.com" {
		t.Fatal("unexpected email")
	}
}

func TestLoginRequest_Fields(t *testing.T) {
	r := LoginRequest{
		Email:    "test@example.com",
		Password: "pass123",
	}
	if r.Email != "test@example.com" {
		t.Fatal("unexpected email")
	}
}

func TestTokenResponse_Fields(t *testing.T) {
	r := TokenResponse{
		AccessToken:  "access",
		RefreshToken: "refresh",
	}
	if r.AccessToken != "access" || r.RefreshToken != "refresh" {
		t.Fatal("unexpected tokens")
	}
}

func TestLoginResponse_Fields(t *testing.T) {
	r := LoginResponse{
		User: &models.User{ID: "u1", Email: "e@e.com"},
		Token: TokenPair{
			AccessToken:  "at",
			RefreshToken: "rt",
		},
	}
	if r.User.ID != "u1" {
		t.Fatal("unexpected user ID")
	}
	if r.Token.AccessToken != "at" {
		t.Fatal("unexpected access token")
	}
}

func TestGuestLoginRequest_Fields(t *testing.T) {
	r := GuestLoginRequest{Name: "Guest"}
	if r.Name != "Guest" {
		t.Fatal("unexpected name")
	}
}

func TestErrorResponse_Fields(t *testing.T) {
	r := ErrorResponse{Error: "something went wrong"}
	if r.Error != "something went wrong" {
		t.Fatal("unexpected error message")
	}
}

func TestLogoutRequest_Fields(t *testing.T) {
	r := LogoutRequest{RefreshToken: "some-token"}
	if r.RefreshToken != "some-token" {
		t.Fatal("unexpected token")
	}
}

// --- Login tests ---

func TestAuthService_Login_Success(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	_, _ = svc.Register("loginok@example.com", "correctpass", "Login OK")

	resp, err := svc.Login("loginok@example.com", "correctpass")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp == nil {
		t.Fatal("expected non-nil response")
	}
	if resp.User == nil {
		t.Fatal("expected non-nil user in response")
	}
	if resp.Token.AccessToken == "" {
		t.Fatal("expected non-empty access token")
	}
	if resp.Token.RefreshToken == "" {
		t.Fatal("expected non-empty refresh token")
	}
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	_, _ = svc.Register("wrongpass@example.com", "realpass", "User")

	_, err := svc.Login("wrongpass@example.com", "wrongpass")
	if err == nil {
		t.Fatal("expected error for wrong password")
	}
	if err.Error() != "invalid password" {
		t.Fatalf("expected 'invalid password', got '%s'", err.Error())
	}
}

func TestAuthService_Login_UserNotFound(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	_, err := svc.Login("nobody@example.com", "anypass")
	if err == nil {
		t.Fatal("expected error for missing user")
	}
	if err.Error() != "user not found" {
		t.Fatalf("expected 'user not found', got '%s'", err.Error())
	}
}

// --- GuestLogin tests ---

func TestAuthService_GuestLogin_Success(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	resp, err := svc.GuestLogin("Guest Player")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.User == nil {
		t.Fatal("expected non-nil user")
	}
	if resp.User.Provider != "guest" {
		t.Fatalf("expected provider 'guest', got '%s'", resp.User.Provider)
	}
	if resp.User.Name != "Guest Player" {
		t.Fatalf("expected name 'Guest Player', got '%s'", resp.User.Name)
	}
	if resp.Token.AccessToken == "" {
		t.Fatal("expected non-empty access token")
	}
}

// --- UpdateProfile tests ---

func TestAuthService_UpdateProfile_Success(t *testing.T) {
	svc, _ := setupAuthService(t)

	user, _ := svc.Register("profile@example.com", "pass", "Old Name")

	updated, err := svc.UpdateProfile(user.ID, "New Name")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "New Name" {
		t.Fatalf("expected 'New Name', got '%s'", updated.Name)
	}
}

func TestAuthService_UpdateProfile_NotFound(t *testing.T) {
	svc, _ := setupAuthService(t)

	_, err := svc.UpdateProfile("nonexistent-id", "Some Name")
	if err == nil {
		t.Fatal("expected error for missing user")
	}
}

// --- ChangePassword tests ---

func TestAuthService_ChangePassword_Success(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	user, _ := svc.Register("chpass@example.com", "oldpass123", "Change Pass")

	err := svc.ChangePassword(user.ID, "oldpass123", "newpass456")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify new password works
	_, loginErr := svc.Login("chpass@example.com", "newpass456")
	if loginErr != nil {
		t.Fatalf("login with new password failed: %v", loginErr)
	}
}

func TestAuthService_ChangePassword_WrongCurrent(t *testing.T) {
	svc, _ := setupAuthService(t)

	user, _ := svc.Register("wrongcur@example.com", "realpass", "User")

	err := svc.ChangePassword(user.ID, "wrongcurrent", "newpass456")
	if err == nil {
		t.Fatal("expected error for wrong current password")
	}
}

func TestAuthService_ChangePassword_NotFound(t *testing.T) {
	svc, _ := setupAuthService(t)

	err := svc.ChangePassword("nonexistent", "any", "newpass")
	if err == nil {
		t.Fatal("expected error for missing user")
	}
}

func TestAuthService_ChangePassword_NonLocalProvider(t *testing.T) {
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	svc := NewAuthService(userRepo, passkeyRepo)

	// Create a user with google provider directly
	googleUser := &models.User{
		ID: "google-user-1", Email: "google@example.com", Name: "Google User",
		Provider: "google", IsActive: true, Accesses: models.StringArray{"user"},
	}
	_ = userRepo.CreateUser(googleUser)

	err := svc.ChangePassword("google-user-1", "any", "newpass")
	if err == nil {
		t.Fatal("expected error for non-local provider")
	}
	if err.Error() != "password change is only available for local accounts" {
		t.Fatalf("unexpected error: %s", err.Error())
	}
}

// --- Logout / BlockRefreshToken / ValidateRefreshToken tests ---

func TestAuthService_Logout_Success(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	user, _ := svc.Register("logout@example.com", "pass", "Logout User")
	loginResp, _ := svc.Login("logout@example.com", "pass")

	err := svc.Logout(user.ID, loginResp.Token.RefreshToken, loginResp.Token.AccessToken)
	if err != nil {
		t.Fatalf("unexpected error during logout: %v", err)
	}
}

func TestAuthService_Logout_InvalidToken(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	user, _ := svc.Register("logout2@example.com", "pass", "Logout User 2")

	err := svc.Logout(user.ID, "not-a-real-jwt", "")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}

func TestAuthService_ValidateRefreshToken_Success(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	user, _ := svc.Register("valrt@example.com", "pass", "Val RT")
	loginResp, _ := svc.Login("valrt@example.com", "pass")

	claims, err := svc.ValidateRefreshToken(loginResp.Token.RefreshToken)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claims.UserID != user.ID {
		t.Fatalf("expected userID '%s', got '%s'", user.ID, claims.UserID)
	}
}

func TestAuthService_ValidateRefreshToken_Blocked(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	_, _ = svc.Register("blockedrt@example.com", "pass", "Blocked RT")
	loginResp, _ := svc.Login("blockedrt@example.com", "pass")

	// Block the token via logout
	_ = svc.BlockRefreshToken("blockedrt@example.com", loginResp.Token.RefreshToken)

	_, err := svc.ValidateRefreshToken(loginResp.Token.RefreshToken)
	if err == nil {
		t.Fatal("expected error for blocked token")
	}
}

func TestAuthService_ValidateRefreshToken_Invalid(t *testing.T) {
	svc, cfg := setupAuthService(t)
	config.SetForTest(cfg)

	_, err := svc.ValidateRefreshToken("totally-invalid-token")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}
