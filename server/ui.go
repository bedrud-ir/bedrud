package server

import "embed"

// UI is the embedded frontend files
//
//go:embed all:frontend
var UI embed.FS
