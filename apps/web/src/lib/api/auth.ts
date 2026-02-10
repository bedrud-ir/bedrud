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
    avatarUrl?: string;
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
export interface GuestLoginRequest {
  name: string;
}

export async function guestLoginAPI(
  data: GuestLoginRequest,
): Promise<LoginResponse> {
  return fetch(`${baseURL}/auth/guest-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error("Guest login failed");
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
  avatarUrl?: string;
  isAdmin?: boolean;
  provider?: string;
}

export function getMeAPI(): Promise<MeResponse> {
  // authFetch handles token attachment and JSON parsing by default
  return authFetch(`${baseURL}/auth/me`);
}

// -------------------------------------------------
// Passkey (WebAuthn) API
// -------------------------------------------------

export async function passkeyRegisterBeginAPI(): Promise<any> {
  return authFetch(`${baseURL}/auth/passkey/register/begin`, {
    method: "POST",
  });
}

export async function passkeyRegisterFinishAPI(data: any): Promise<any> {
  return authFetch(`${baseURL}/auth/passkey/register/finish`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function passkeyLoginBeginAPI(): Promise<any> {
  const res = await fetch(`${baseURL}/auth/passkey/login/begin`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to start passkey login");
  return res.json();
}

export async function passkeyLoginFinishAPI(data: any): Promise<LoginResponse> {
  const res = await fetch(`${baseURL}/auth/passkey/login/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Passkey login failed");
  }
  return res.json();
}

export async function passkeySignupBeginAPI(data: { email: string; name: string }): Promise<any> {
  const res = await fetch(`${baseURL}/auth/passkey/signup/begin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to start passkey signup");
  }
  return res.json();
}

export async function passkeySignupFinishAPI(data: any): Promise<LoginResponse> {
  const res = await fetch(`${baseURL}/auth/passkey/signup/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Passkey signup failed");
  }
  return res.json();
}
