package main

import (
	"bedrud-backend/config"
	"bedrud-backend/internal/database"
	"bedrud-backend/internal/models"
	"bedrud-backend/internal/repository"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	// Command flags
	createUser  = flag.Bool("create", false, "Create a new user")
	deleteUser  = flag.Bool("delete", false, "Delete a user")
	makeAdmin   = flag.Bool("make-admin", false, "Make user an admin")
	removeAdmin = flag.Bool("remove-admin", false, "Remove admin privileges")

	// User data flags
	email    = flag.String("email", "", "User's email")
	password = flag.String("password", "", "User's password")
	name     = flag.String("name", "", "User's name")
)

func main() {
	flag.Parse()

	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	// Load configuration
	cfg, err := config.Load("config.yaml")
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	// Initialize database
	if err := database.Initialize(&cfg.Database); err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}
	defer database.Close()

	// Initialize repository
	userRepo := repository.NewUserRepository(database.GetDB())

	// Execute command
	switch {
	case *createUser:
		return handleCreateUser(userRepo)
	case *deleteUser:
		return handleDeleteUser(userRepo)
	case *makeAdmin:
		return handleMakeAdmin(userRepo)
	case *removeAdmin:
		return handleRemoveAdmin(userRepo)
	default:
		printUsage()
		return nil
	}
}

func handleCreateUser(userRepo *repository.UserRepository) error {
	if *email == "" || *password == "" || *name == "" {
		return fmt.Errorf("email, password, and name are required")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		ID:        uuid.New().String(),
		Email:     *email,
		Password:  string(hashedPassword),
		Name:      *name,
		Provider:  "local",
		Accesses:  models.StringArray{"user"},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := userRepo.CreateUser(user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	fmt.Printf("Successfully created user: %s\n", user.Email)
	return nil
}

func handleDeleteUser(userRepo *repository.UserRepository) error {
	if *email == "" {
		return fmt.Errorf("email is required")
	}

	user, err := userRepo.GetUserByEmail(*email)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	if err := userRepo.DeleteUser(user.ID); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	fmt.Printf("Successfully deleted user: %s\n", user.Email)
	return nil
}

func handleMakeAdmin(userRepo *repository.UserRepository) error {
	if *email == "" {
		return fmt.Errorf("email is required")
	}

	user, err := userRepo.GetUserByEmail(*email)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	// Add superadmin and admin access if not present
	hasAdmin := false
	hasSuperAdmin := false
	for _, access := range user.Accesses {
		if access == "admin" {
			hasAdmin = true
		}
		if access == "superadmin" {
			hasSuperAdmin = true
		}
	}

	if !hasAdmin {
		user.Accesses = append(user.Accesses, "admin")
	}
	if !hasSuperAdmin {
		user.Accesses = append(user.Accesses, "superadmin")
	}

	if err := userRepo.UpdateUser(user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	fmt.Printf("Successfully made user admin: %s\n", user.Email)
	return nil
}

func handleRemoveAdmin(userRepo *repository.UserRepository) error {
	if *email == "" {
		return fmt.Errorf("email is required")
	}

	user, err := userRepo.GetUserByEmail(*email)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	// Remove admin and superadmin access
	newAccesses := make([]string, 0)
	for _, access := range user.Accesses {
		if access != "admin" && access != "superadmin" {
			newAccesses = append(newAccesses, access)
		}
	}
	user.Accesses = newAccesses

	if err := userRepo.UpdateUser(user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	fmt.Printf("Successfully removed admin privileges from user: %s\n", user.Email)
	return nil
}

func printUsage() {
	fmt.Println("Usage:")
	fmt.Println("  Create user:    cli -create -email=user@example.com -password=secret -name=\"John Doe\"")
	fmt.Println("  Delete user:    cli -delete -email=user@example.com")
	fmt.Println("  Make admin:     cli -make-admin -email=user@example.com")
	fmt.Println("  Remove admin:   cli -remove-admin -email=user@example.com")
}
