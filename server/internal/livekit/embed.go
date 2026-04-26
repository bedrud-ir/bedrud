//go:build !windows

package livekit

import "embed"

// Bin is the embedded LiveKit server binary
//
//go:embed bin/livekit-server
var Bin embed.FS

const (
	lkBinKey  = "bin/livekit-server"
	lkExeName = "bedrud-livekit-server"
)
