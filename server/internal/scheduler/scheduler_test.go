package scheduler

import "testing"

func TestInitialize_DoesNotPanic(t *testing.T) {
	// Initialize should not panic
	Initialize()
	// Stop should not panic either
	Stop()
}

func TestStop_BeforeInitialize(t *testing.T) {
	// Should not panic if called before Initialize
	Stop()
}
