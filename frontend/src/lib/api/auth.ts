import { baseURL, authFetch } from "../api";

// -------------------------------------------------
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
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

export async function loginAPI(data: LoginRequest): Promise<LoginResponse> {
  return fetch(`${baseURL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  });
}

// -------------------------------------------------
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}
export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
}

export async function registerAPI(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  return fetch(`${baseURL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(async (res) => {
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Registration failed");
    }
    return res.json();
  });
}

// -------------------------------------------------
export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export async function authRefreshAPI(
  data: RefreshTokenRequest,
): Promise<RefreshTokenResponse> {
  return fetch(`${baseURL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error("Token refresh failed");
    return res.json();
  });
}

// -------------------------------------------------
//
export interface MeResponse {
  id: string;
  email: string;
  name: string;
  pictureUrl?: string;
  isAdmin?: boolean;
  provider?: string;
}

export function getMeAPI(): Promise<MeResponse> {
  // authFetch handles token attachment and JSON parsing by default
  return authFetch(`${baseURL}/auth/me`);
}
