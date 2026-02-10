import type { AdminUser } from "$lib/models/users";
import { baseURL, authFetch } from "../api";
import type { Room } from "../models/room";

// -------------------------------------------------

export type ListAllRoomsResponse = Room[];

export function listAllRoomsAPI(
  skip: number = 0,
  limit: number = 20,
): Promise<ListAllRoomsResponse> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  return authFetch(`${baseURL}/admin/rooms?${params}`);
}

// -------------------------------------------------

export type GetRoomsResponse = Room[];

export function getRoomsAPI(): Promise<GetRoomsResponse> {
  return authFetch(`${baseURL}/admin/rooms`);
}

// -------------------------------------------------

export interface GenerateRoomTokenRequest {
  userId: string;
  duration?: number; // duration in minutes
}

export interface GenerateRoomTokenResponse {
  token: string; // Assuming the API returns an object with a token property
  // Add other properties if the actual response is different
}
export function generateRoomTokenAPI(
  roomId: string,
  data: GenerateRoomTokenRequest,
): Promise<GenerateRoomTokenResponse> {
  return authFetch(`${baseURL}/admin/rooms/${roomId}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// -------------------------------------------------
export type UpdateRoomRequest = Partial<Room>;
export type UpdateRoomResponse = Room;

export function updateRoomAPI(
  roomId: string,
  data: UpdateRoomRequest,
): Promise<UpdateRoomResponse> {
  return authFetch(`${baseURL}/admin/rooms/${roomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// -------------------------------------------------
export interface AdminUsersResponse {
  users: AdminUser[];
}

export function listUsersAPI(): Promise<AdminUsersResponse> {
  return authFetch(`${baseURL}/admin/users`);
}

// -------------------------------------------------

// For updateUserStatusAPI
export interface UpdateUserStatusRequest {
  active: boolean;
}

export interface UpdateUserStatusResponse {
  message: string;
}
export function updateUserStatusAPI(
  userId: string,
  data: UpdateUserStatusRequest,
): Promise<UpdateUserStatusResponse> {
  return authFetch(`${baseURL}/admin/users/${userId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), // data is { active: boolean }
  });
}
