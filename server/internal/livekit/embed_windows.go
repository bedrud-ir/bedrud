//go:build windows

package livekit

import "embed"

// Bin is the embedded LiveKit server binary (Windows)
//
//go:embed bin/livekit-server.exe
var Bin embed.FS

const (
	lkBinKey  = "bin/livekit-server.exe"
	lkExeName = "bedrud-livekit-server.exe"
)
