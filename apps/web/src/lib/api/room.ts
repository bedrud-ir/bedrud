import type { Room, RoomSettings } from "$lib/models/room";
export type { Room, RoomSettings };
import { baseURL, authFetch } from "../api";

// -------------------------------------------------
export interface CreateRoomRequest {
  name?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  mode?: string;
  settings?: RoomSettings;
}

export type CreateRoomResponse = Room;

export function createRoomAPI(
  data: CreateRoomRequest,
): Promise<CreateRoomResponse> {
  return authFetch(`${baseURL}/room/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// -------------------------------------------------
export interface UserRoomResponse {
  id: string;
  name: string;
  createdBy: string;
  isActive: boolean;
  maxParticipants: number;
  expiresAt: string; // Assuming backend sends time.Time as string
  settings: RoomSettings;
  relationship: string; // "creator" or "participant"
  mode: string; // Room mode (e.g. "standard")
}

export function listRoomsAPI(): Promise<UserRoomResponse[]> {
  return authFetch(`${baseURL}/room/list`, {
    method: "GET",
  });
}

// -------------------------------------------------
export interface JoinRoomRequest {
  roomName: string;
}

export interface JoinRoomResponse {
  id: string;
  name: string;
  token: string;
  livekitHost: string;
  createdBy: string;
  adminId: string;
  isActive: boolean;
  isPublic: boolean;
  maxParticipants: number;
  expiresAt: string;
  settings: RoomSettings;
  mode: string;
}

export function joinRoomAPI(data: JoinRoomRequest): Promise<JoinRoomResponse> {
  return authFetch(`${baseURL}/room/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// -------------------------------------------------
// Admin Actions
// -------------------------------------------------

export function kickParticipantAPI(roomId: string, identity: string): Promise<any> {
  return authFetch(`${baseURL}/room/${roomId}/kick/${identity}`, {
    method: "POST",
  });
}

export function muteParticipantAPI(roomId: string, identity: string): Promise<any> {
  return authFetch(`${baseURL}/room/${roomId}/mute/${identity}`, {
    method: "POST",
  });
}

export function disableParticipantVideoAPI(roomId: string, identity: string): Promise<any> {
  return authFetch(`${baseURL}/room/${roomId}/video/${identity}/off`, {
    method: "POST",
  });
}

export function bringToStageAPI(roomId: string, identity: string): Promise<any> {
  return authFetch(`${baseURL}/room/${roomId}/stage/${identity}/bring`, {
    method: "POST",
  });
}

export function removeFromStageAPI(roomId: string, identity: string): Promise<any> {
  return authFetch(`${baseURL}/room/${roomId}/stage/${identity}/remove`, {
    method: "POST",
  });
}

export function updateRoomSettingsAPI(roomId: string, settings: RoomSettings): Promise<any> {
  return authFetch(`${baseURL}/room/${roomId}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}
