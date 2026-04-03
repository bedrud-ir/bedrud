package usercli

import (
	"bedrud/config"
	"bedrud/internal/database"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"fmt"
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
