//go:build mage
// +build mage

package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/magefile/mage/mg"
)

const (
	appName = "bedrud-backend"
	distDir = "dist"
)

func Build() error {
	mg.Deps(InstallDeps, Swagger)
	fmt.Println("Building...")

	// Create dist directory if it doesn't exist
	if err := os.MkdirAll(distDir, 0755); err != nil {
		return err
	}

	Swagger()

	// Copy config.yaml to dist
	fmt.Println("Copying config file...")
	src, err := os.Open("config.yaml")
	if err != nil {
		return fmt.Errorf("error opening config.yaml: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(filepath.Join(distDir, "config.yaml"))
	if err != nil {
		return fmt.Errorf("error creating dist config.yaml: %w", err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return fmt.Errorf("error copying config file: %w", err)
	}

	cmd := exec.Command("go", "build", "-o", filepath.Join(distDir, appName), "./cmd/server")
	return cmd.Run()
}

func Install() error {
	mg.Deps(Build)
	fmt.Println("Installing...")
	return os.Rename(filepath.Join(distDir, appName), "/usr/bin/"+appName)
}

func InstallDeps() error {
	fmt.Println("Installing Deps...")
	cmd := exec.Command("go", "get", "github.com/stretchr/piglatin")
	return cmd.Run()
}

func Clean() {
	fmt.Println("Cleaning...")
	os.RemoveAll(distDir)
}

func Swagger() error {
	fmt.Println("Generating Swagger docs...")
	cmd := exec.Command("swag", "init", "-g", "cmd/server/main.go")
	return cmd.Run()
}
