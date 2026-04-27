package usercli

import (
	"bedrud/config"
	"bedrud/internal/database"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// PromoteUser grants superadmin access to the user with the given email.
func PromoteUser(configPath, email string) error {
	return withUser(configPath, email, func(repo *repository.UserRepository, user *models.User) error {
		for _, a := range user.Accesses {
			if a == string(models.AccessSuperAdmin) {
				fmt.Printf("User %q already has superadmin access.\n", email)
				return nil
			}
		}
		user.Accesses = append(user.Accesses, string(models.AccessSuperAdmin))
		if err := repo.UpdateUserAccesses(user.ID, []string(user.Accesses)); err != nil {
			return fmt.Errorf("failed to update accesses: %w", err)
		}
		fmt.Printf("✓ User %q is now a superadmin.\n", email)
		return nil
	})
}

// DemoteUser removes superadmin access from the user with the given email.
func DemoteUser(configPath, email string) error {
	return withUser(configPath, email, func(repo *repository.UserRepository, user *models.User) error {
		filtered := user.Accesses[:0]
		for _, a := range user.Accesses {
			if a != string(models.AccessSuperAdmin) {
				filtered = append(filtered, a)
			}
		}
		if len(filtered) == len(user.Accesses) {
			fmt.Printf("User %q does not have superadmin access.\n", email)
			return nil
		}
		if err := repo.UpdateUserAccesses(user.ID, []string(filtered)); err != nil {
			return fmt.Errorf("failed to update accesses: %w", err)
		}
		fmt.Printf("✓ Removed superadmin from %q.\n", email)
		return nil
	})
}

// CreateUser creates a new user with local authentication.
func CreateUser(configPath, email, password, name string) error {
	cfg, err := config.Load(configPath)
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	if err := database.Initialize(&cfg.Database); err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer database.Close()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		ID:        uuid.New().String(),
		Email:     email,
		Password:  string(hashedPassword),
		Name:      name,
		Provider:  "local",
		Accesses:  models.StringArray{"user"},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	repo := repository.NewUserRepository(database.GetDB())

	existing, err := repo.GetUserByEmail(email)
	if err != nil {
		return fmt.Errorf("failed to check existing user: %w", err)
	}
	if existing != nil {
		return fmt.Errorf("user with email %s already exists", email)
	}

	if err := repo.CreateUser(user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	fmt.Printf("✓ Created user: %s\n", user.Email)
	return nil
}

// DeleteUser removes a user by email address.
func DeleteUser(configPath, email string) error {
	cfg, err := config.Load(configPath)
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	if err := database.Initialize(&cfg.Database); err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer database.Close()

	repo := repository.NewUserRepository(database.GetDB())
	user, err := repo.GetUserByEmail(email)
	if err != nil {
		return fmt.Errorf("database error: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user not found: %s", email)
	}

	if err := repo.DeleteUser(user.ID); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	fmt.Printf("✓ Deleted user: %s\n", user.Email)
	return nil
}

func withUser(configPath, email string, fn func(*repository.UserRepository, *models.User) error) error {
	cfg, err := config.Load(configPath)
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	if err := database.Initialize(&cfg.Database); err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer database.Close()

	repo := repository.NewUserRepository(database.GetDB())
	user, err := repo.GetUserByEmail(email)
	if err != nil {
		return fmt.Errorf("database error: %w", err)
	}
	if user == nil {
		return fmt.Errorf("no user found with email %q", email)
	}
	return fn(repo, user)
}
