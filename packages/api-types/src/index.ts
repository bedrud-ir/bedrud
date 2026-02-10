// ─── Models ───

export interface RoomSettings {
  allowChat: boolean;
  allowVideo: boolean;
  allowAudio: boolean;
  requireApproval: boolean;
  e2ee: boolean;
}

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

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  adminId: string;
  isActive: boolean;
  isPublic: boolean;
  maxParticipants: number;
  expiresAt: string;
  settings: RoomSettings;
  relationship?: string;
  mode: string;
  participants?: RoomParticipant[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: string;
  isAdmin?: boolean;
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

export interface Message {
  sender: string;
  text?: string;
  imageUrl?: string;
  timestamp: number;
  isLocal: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── API Request/Response Types ───

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    isAdmin?: boolean;
  };
}

export interface GuestLoginRequest {
  name: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  provider?: string;
}

export interface CreateRoomRequest {
  name?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  mode?: string;
  settings?: RoomSettings;
}

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

export interface UserRoomResponse {
  id: string;
  name: string;
  createdBy: string;
  isActive: boolean;
  maxParticipants: number;
  expiresAt: string;
  settings: RoomSettings;
  relationship: string;
  mode: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface UpdateUserStatusRequest {
  active: boolean;
}

export interface GenerateRoomTokenRequest {
  userId: string;
  duration?: number;
}

export interface GenerateRoomTokenResponse {
  token: string;
}

// ─── Endpoint Constants ───

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    GUEST_LOGIN: "/auth/guest-login",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    PASSKEY_REGISTER_BEGIN: "/auth/passkey/register/begin",
    PASSKEY_REGISTER_FINISH: "/auth/passkey/register/finish",
    PASSKEY_LOGIN_BEGIN: "/auth/passkey/login/begin",
    PASSKEY_LOGIN_FINISH: "/auth/passkey/login/finish",
    PASSKEY_SIGNUP_BEGIN: "/auth/passkey/signup/begin",
    PASSKEY_SIGNUP_FINISH: "/auth/passkey/signup/finish",
    OAUTH_LOGIN: (provider: string) => `/auth/${provider}/login`,
    OAUTH_CALLBACK: (provider: string) => `/auth/${provider}/callback`,
  },
  ROOM: {
    CREATE: "/room/create",
    JOIN: "/room/join",
    LIST: "/room/list",
    KICK: (roomId: string, identity: string) =>
      `/room/${roomId}/kick/${identity}`,
    MUTE: (roomId: string, identity: string) =>
      `/room/${roomId}/mute/${identity}`,
    VIDEO_OFF: (roomId: string, identity: string) =>
      `/room/${roomId}/video/${identity}/off`,
    STAGE_BRING: (roomId: string, identity: string) =>
      `/room/${roomId}/stage/${identity}/bring`,
    STAGE_REMOVE: (roomId: string, identity: string) =>
      `/room/${roomId}/stage/${identity}/remove`,
    SETTINGS: (roomId: string) => `/room/${roomId}/settings`,
  },
  ADMIN: {
    USERS: "/admin/users",
    USER_STATUS: (userId: string) => `/admin/users/${userId}/status`,
    ROOMS: "/admin/rooms",
    ROOM: (roomId: string) => `/admin/rooms/${roomId}`,
    ROOM_TOKEN: (roomId: string) => `/admin/rooms/${roomId}/token`,
  },
} as const;
