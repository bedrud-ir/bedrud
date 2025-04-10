import { getToken } from './auth';
import { userStore } from './stores/user.store';

export const baseURL = import.meta.env.VITE_BACKEND_API;

interface LoginResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    pictureUrl?: string;
    isAdmin?: boolean;
  };
}

interface RegisterResponse {
  access_token: string;
  refresh_token: string;
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

interface RoomSettings {
  allowChat: boolean;
  allowVideo: boolean;
  allowAudio: boolean;
  requireApproval: boolean;
}

interface RoomParticipant {
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

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  isActive: boolean;
  maxParticipants: number;
  expiresAt: string;
  settings: RoomSettings;
  participants: RoomParticipant[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  isActive: boolean;
  accesses: string[] | null;
  createdAt: string;
}

interface AdminUsersResponse {
  users: AdminUser[];
}

interface UpdateUserStatusResponse {
  message: string;
}

export async function authFetch(url, options = {
}) {
  let token;
  try {
    token = await getToken();
  } catch (e) {
    userStore.update((user) => null);
    console.log("need auth");
    console.error("error", e);
    return Promise.reject(e);
  }

  const doParseJson = options?.parseJson !== false;
  // delete options.parseJson from options if it exists;
  if (options.hasOwnProperty("parseJson")) {
    delete (options as any).parseJson;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Authorization": `Bearer ${token?.accessToken ?? ""}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (doParseJson) {
    return response.json();
  }

  return response;
}


// ----------------- Authentication API -----------------
export function loginAPI(email: string, password: string): Promise<LoginResponse> {
  return fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(res => {
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  });
}

export function registerAPI(data: {
  email: string;
  password: string;
  name: string;
}): Promise<RegisterResponse> {
  return fetch(`${baseURL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async res => {
    if (!res.ok) {
      // Parse the error response to get the specific error message
      const errorData = await res.json();
      throw new Error(errorData.error || 'Registration failed');
    }
    return res.json();
  });
}

export function oAuthLoginAPI(provider: 'google' | 'github' | 'twitter') {
  return fetch(`${baseURL}/auth/${provider}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json());
}

export function authRefresh(refreshToken: string): Promise<RefreshTokenResponse> {
  return fetch(`${baseURL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  }).then(res => {
    if (!res.ok) throw new Error('Token refresh failed');
    return res.json();
  });
}

// ----------------- Room Management API -----------------
export function createRoomAPI(data: {
  name?: string;
  maxParticipants?: number;
}) {
  return authFetch(`${baseURL}/create-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
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

export function joinRoomAPI(data: {
  roomName: string;  // Changed from roomId to roomName
}): Promise<JoinRoomResponse> {
  return authFetch(`${baseURL}/join-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// ----------------- Admin Room Management API -----------------
export function listAllRoomsAPI(skip = 0, limit = 20) {
  const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
  return authFetch(`${baseURL}/admin/rooms?${params}`);
}

export function generateRoomTokenAPI(roomId: string, data: {
  userId: string;
  duration?: number; // duration in minutes
}) {
  return authFetch(`${baseURL}/admin/rooms/${roomId}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export function getRoomsAPI() {
  return authFetch(`${baseURL}/admin/rooms`);
}

export function updateRoomAPI(roomId: string, data: Partial<Room>) {
  return authFetch(`${baseURL}/admin/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// ----------------- Admin User Management API -----------------
export function listUsersAPI() {
  return authFetch<AdminUsersResponse>(`${baseURL}/admin/users`);
}

export function updateUserStatusAPI(userId: string, active: boolean) {
  return authFetch<UpdateUserStatusResponse>(`${baseURL}/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active })
  });
}
