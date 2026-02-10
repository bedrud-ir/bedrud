package database

import (
	"bedrud/config"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite" // Added for SQLite support
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

// Initialize sets up the database connection
func Initialize(cfg *config.DatabaseConfig) error {
	var err error
	var dsn string
	var dialector gorm.Dialector

	// Configure GORM
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// Determine database type and prepare dialector
	dbType := cfg.Type
	if dbType == "" {
		// Default to postgres if not specified in config, though config should have a default
		log.Warn().Msg("Database type not specified in config, defaulting to postgres")
		dbType = "postgres"
	}

	log.Info().Str("databaseType", dbType).Msg("Initializing database")

	switch dbType {
	case "postgres":
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			cfg.Host,
			cfg.User,
			cfg.Password,
			cfg.DBName,
			cfg.Port,
			cfg.SSLMode,
		)
		dialector = postgres.Open(dsn)
		log.Info().Msg("Using PostgreSQL driver")
	case "sqlite":
		if cfg.Path == "" {
			err = fmt.Errorf("SQLite database path (DB_PATH or config.database.path) is not configured")
			log.Error().Err(err).Msg("SQLite configuration error")
			return err
		}
		dsn = cfg.Path // For SQLite, DSN is the file path
		dialector = sqlite.Open(dsn)
		log.Info().Str("path", dsn).Msg("Using SQLite driver")
	default:
		err = fmt.Errorf("unsupported database type: %s. Supported types are 'postgres' and 'sqlite'", dbType)
		log.Error().Err(err).Msg("Database configuration error")
		return err
	}

	// Connect to the database
	db, err = gorm.Open(dialector, gormConfig)
	if err != nil {
		log.Error().Err(err).Str("dsn_used", dsn).Msg("Failed to connect to database") // Log DSN for SQLite for easier debugging
		return err
	}

	// Configure connection pool (these settings might have limited or no effect for SQLite)
	sqlDB, err := db.DB()
	if err != nil {
		log.Error().Err(err).Msg("Failed to get underlying *sql.DB")
		return err
	}

	if cfg.Type == "postgres" || cfg.Type == "" { // Apply pooling mainly for PostgreSQL
		if cfg.MaxIdleConns > 0 {
			sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
		}
		if cfg.MaxOpenConns > 0 {
			sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
		}
		if cfg.MaxLifetime > 0 {
			sqlDB.SetConnMaxLifetime(time.Duration(cfg.MaxLifetime) * time.Minute)
		}
	} else if cfg.Type == "sqlite" {
		// For SQLite, generally, MaxOpenConns = 1 is a common practice to avoid "database is locked" errors
		// if not using WAL mode. GORM's default might handle this, or you might set it explicitly.
		// sqlDB.SetMaxOpenConns(1) // Optional: consider if you face locking issues.
		log.Info().Msg("SQLite connection established. Connection pool settings (MaxIdleConns, MaxOpenConns, MaxLifetime) are generally less relevant or behave differently for SQLite.")
	}


	log.Info().Msg("Database connection established successfully")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return db
}

// Close closes the database connection
func Close() error {
	if db != nil {
		sqlDB, err := db.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}
