import { Room, VideoPresets, Track } from 'livekit-client';

interface LiveKitMeetingData {
    id: string;
    name: string;
    token: string;
    createdBy: string;
    isActive: boolean;
    maxParticipants: number;
    expiresAt: string;
    settings: {
        allowChat: boolean;
        allowVideo: boolean;
        allowAudio: boolean;
        requireApproval: boolean;
    };
}

export function createRoom() {
    return new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
        },
    });
}

const log = (msg: string) => {
    console.log(`[room] ${msg}`);
};

// Use environment variable or default to localhost for development
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://127.0.0.1:7880';

export async function connectToRoom(room: Room, token: string): Promise<void> {
    log('Connecting to room');

    try {
        // Pre-warm connection
        await room.prepareConnection(LIVEKIT_URL, token);

        log('Prepared connection');
        // Connect with auto-subscribe enabled
        await room.connect(LIVEKIT_URL, token, {
            autoSubscribe: true
        });

        log('Connected to room');

        return new Promise((resolve) => {
            if (room.state === 'connected') {
                log('Already connected');
                resolve();
            } else {
                room.once('connected', () => {
                    log('Connected to room');
                    resolve();
                });
            }
        });
    } catch (error) {
        log(`Failed to connect: ${error}`);
        throw error;
    }
}

export function attachTrack(track: Track, elementId: string) {
    const element = track.attach();
    if (element instanceof HTMLVideoElement) {
        element.autoplay = true;
        element.playsInline = true;
        element.muted = true;
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.objectFit = 'cover';
    }

    const container = document.getElementById(elementId);
    if (container) {
        container.innerHTML = '';
        container.appendChild(element);
    }
    return element;
}

export function detachTrack(track: Track) {
    track.detach();
}

// Toggle camera on/off
export async function toggleCamera(room: Room): Promise<boolean> {
    if (!room.localParticipant) return false;
    
    const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
    
    if (cameraTrack) {
        if (cameraTrack.isEnabled) {
            cameraTrack.setEnabled(false);
            return false;
        } else {
            cameraTrack.setEnabled(true);
            return true;
        }
    } else {
        await room.localParticipant.enableCameraAndMicrophone();
        return true;
    }
}

// Toggle microphone on/off
export async function toggleMicrophone(room: Room): Promise<boolean> {
    if (!room.localParticipant) return false;
    
    const micTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    
    if (micTrack) {
        if (micTrack.isEnabled) {
            micTrack.setEnabled(false);
            return false;
        } else {
            micTrack.setEnabled(true);
            return true;
        }
    } else {
        await room.localParticipant.enableCameraAndMicrophone();
        return true;
    }
}

// Start screen sharing
export async function startScreenShare(room: Room): Promise<boolean> {
    if (!room.localParticipant) return false;
    
    try {
        await room.localParticipant.setScreenShareEnabled(true);
        return true;
    } catch (error) {
        log(`Screen share failed: ${error}`);
        return false;
    }
}

// Stop screen sharing
export async function stopScreenShare(room: Room): Promise<boolean> {
    if (!room.localParticipant) return false;
    
    try {
        await room.localParticipant.setScreenShareEnabled(false);
        return true;
    } catch (error) {
        log(`Stop screen share failed: ${error}`);
        return false;
    }
}

// Disconnect from the room
export function disconnectFromRoom(room: Room): void {
    if (room) {
        room.disconnect();
        log('Disconnected from room');
    }
}
