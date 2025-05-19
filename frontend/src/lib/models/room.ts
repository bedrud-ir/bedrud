// For Room Settings
export interface RoomSettings {
  allowChat: boolean;
  allowVideo: boolean;
  allowAudio: boolean;
  requireApproval: boolean;
}

// For Room Participants
export interface RoomParticipant {
  id: string;
  userId: string;
  email: string;
  name: string;
  joinedAt: string;
  isActive: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isChatBlocked: boolean;
  permissions: string;
}

// For Room structure
export interface Room {
  id: string;
  name: string;
  createdBy: string;
  isActive: boolean;
  maxParticipants: number;
  expiresAt: string;
  settings: RoomSettings;
  relationship: string; // "creator" or "participant"
}
