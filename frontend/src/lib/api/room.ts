import type { Room, RoomSettings } from "$lib/models/room";
import { baseURL, authFetch } from "../api";

// -------------------------------------------------
export interface CreateRoomRequest {
  name?: string;
  maxParticipants?: number;
}

export type CreateRoomResponse = Room;

export function createRoomAPI(
  data: CreateRoomRequest,
): Promise<CreateRoomResponse> {
  return authFetch(`${baseURL}/create-room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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
  LiveKitHost: string;
  createdBy: string;
  isActive: boolean;
  maxParticipants: number;
  expiresAt: string;
  settings: RoomSettings;
}

export function joinRoomAPI(data: JoinRoomRequest): Promise<JoinRoomResponse> {
  return authFetch(`${baseURL}/room/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
