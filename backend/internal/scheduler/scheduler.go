package scheduler

import (
	"time"

	"github.com/go-co-op/gocron"
)

var scheduler *gocron.Scheduler

// Initialize creates and starts the scheduler
func Initialize() {
	scheduler = gocron.NewScheduler(time.Local)

	// // Add test task that runs every second
	// _, err := scheduler.Every(1).Second().Do(func() {
	// 	log.Info().Msg("Scheduler test task running")
	// })

	// if err != nil {
	// 	log.Error().Err(err).Msg("Failed to schedule test task")
	// }

	// Start scheduler in a separate goroutine
	scheduler.StartAsync()
}

// Stop gracefully shuts down the scheduler
func Stop() {
	if scheduler != nil {
		scheduler.Stop()
	}
}
