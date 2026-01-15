import type { Room, RoomSettings } from "$lib/models/room";
import { baseURL, authFetch, optionalAuthFetch } from "../api";

// -------------------------------------------------
export interface CreateRoomRequest {
  name?: string;
  maxParticipants?: number;
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
}

export function listRoomsAPI(): Promise<UserRoomResponse[]> {
  return authFetch(`${baseURL}/room/list`, {
    method: "GET",
  });
}

// -------------------------------------------------
export interface JoinRoomRequest {
  roomName: string;
  userName?: string;
}

export interface JoinRoomResponse {
  id: string;
  name: string;
  token: string;
  LiveKitHost: string;
  createdBy: string;
  isActive: boolean;
  maxParticipants: number;
  expiresAt: string;
  settings: RoomSettings;
}

export function joinRoomAPI(data: JoinRoomRequest): Promise<JoinRoomResponse> {
  return optionalAuthFetch(`${baseURL}/room/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
