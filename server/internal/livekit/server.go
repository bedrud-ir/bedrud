package livekit

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/rs/zerolog/log"
)

// ExportBinary writes the embedded LiveKit server binary to the specified path
func ExportBinary(destPath string) error {
	binData, err := Bin.ReadFile(lkBinKey)
	if err != nil {
		return fmt.Errorf("failed to read embedded LiveKit binary: %w", err)
	}
	// Unlink before writing — on Linux you cannot overwrite a file that is
	// currently mapped as an executable (ETXTBSY).  Removing the path lets
	// the running process keep its inode while we create a fresh one.
	_ = os.Remove(destPath)
	if err := os.WriteFile(destPath, binData, 0o755); err != nil {
		return fmt.Errorf("failed to write LiveKit binary to %s: %w", destPath, err)
	}
	return nil
}

// RunLiveKit starts the embedded LiveKit server directly with the provided config
func RunLiveKit(configPath string) error {
	lkPath := filepath.Join(os.TempDir(), lkExeName)
	if err := ExportBinary(lkPath); err != nil {
		return err
	}
	if err := os.Chmod(lkPath, 0o755); err != nil {
		log.Warn().Err(err).Msg("Failed to set executable permissions on LiveKit binary")
	}

	args := []string{}
	if configPath != "" {
		args = append(args, "--config", configPath)
	}

	cmd := exec.Command(lkPath, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	log.Info().Str("path", lkPath).Str("config", configPath).Msg("➜ Running embedded LiveKit server")
	return cmd.Run()
}

// StartInternalServer starts a LiveKit server using the provided config file
func StartInternalServer(ctx context.Context, apiKey, apiSecret string, port int, certFile, keyFile, externalConfigPath string) error {
	// Skip if we are running in a mode where external LiveKit is preferred (managed by systemd)
	if os.Getenv("LIVEKIT_MANAGED") == "true" {
		log.Info().Msg("➜ Skipping internal LiveKit management (managed by system service)")
		return nil
	}

	tempDir := os.TempDir()
	lkPath := filepath.Join(tempDir, lkExeName)
	if err := ExportBinary(lkPath); err != nil {
		log.Error().Err(err).Msg("Failed to export embedded LiveKit binary")
		// Fallback to PATH if export fails
		lkPath = lkExeName
	} else {
		if err := os.Chmod(lkPath, 0o755); err != nil {
			log.Warn().Err(err).Msg("Failed to set executable permissions on LiveKit binary")
		}
	}

	args := []string{}
	if externalConfigPath != "" {
		args = append(args, "--config", externalConfigPath)
	} else {
		args = append(args, "--port", fmt.Sprintf("%d", port), "--keys", fmt.Sprintf("%s: %s", apiKey, apiSecret))
	}

	cmd := exec.CommandContext(ctx, lkPath, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	go func() {
		log.Info().Str("path", lkPath).Msg("➜ Starting internal LiveKit process")
		if err := cmd.Run(); err != nil {
			log.Error().Err(err).Msg("LiveKit process exited")
		}
	}()

	time.Sleep(3 * time.Second)
	return nil
}
