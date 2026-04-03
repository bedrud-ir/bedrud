package scheduler

import (
	"testing"

	"bedrud/config"
)

func TestInitialize_DoesNotPanic(t *testing.T) {
	// Initialize should not panic with nil deps
	Initialize(nil, config.LiveKitConfig{})
	// Stop should not panic either
	Stop()
}

func TestStop_BeforeInitialize(t *testing.T) {
	// Should not panic if called before Initialize
	Stop()
}
