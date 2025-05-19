import { authStore } from "./stores/auth.store";
import { userStore } from "./stores/user.store";
import { authFetch } from "./api";
import {
  loginAPI,
  type LoginRequest,
  type LoginResponse,
  registerAPI,
  type RegisterRequest,
  type RegisterResponse,
  authRefreshAPI,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
  getMeAPI,
  type MeResponse,
} from "./api/auth";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  email: string;
  accesses: string[];
  provider: string;
  exp: number;
  iat: number;
}

export async function login(
  email: string,
  password: string,
  remember: boolean = false,
) {
  const response: LoginResponse = await loginAPI({ email, password });
  if (response.tokens && response.user) {
    authStore.setTokens(response.tokens, remember);
    userStore.set(response.user, remember);
    return response.user;
  }
  throw new Error("Login failed");
}

export async function register(email: string, password: string, name: string) {
  try {
    const response: RegisterResponse = await registerAPI({
      email,
      password,
      name,
    });
    console.log(response);

    if (response.access_token && response.refresh_token) {
      // Convert snake_case response to camelCase for the auth store
      const tokens = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };

      // Set tokens in auth store
      authStore.setTokens(tokens);

      // Decode JWT to get user info with proper typing
      const decoded = jwtDecode<DecodedToken>(tokens.accessToken);

      // Create user object from decoded JWT
      const user = {
        id: decoded.userId,
        email: decoded.email,
        name: name,
        pictureUrl: undefined,
        isAdmin: decoded.accesses?.includes("admin"),
      };

      // Set user in user store
      userStore.set(user);

      return user;
    }

    throw new Error("Registration failed");
  } catch (error) {
    // Re-throw the error with the specific message from the API
    throw error;
  }
}

export async function storeTokenAndMinimalUser(
  accessToken: string,
  remember: boolean = true,
) {
  if (!accessToken) {
    throw new Error("No access token provided.");
  }

  const tokens = {
    accessToken: accessToken,
    refreshToken: "",
  };

  authStore.setTokens(tokens, remember);

  const decoded = jwtDecode<DecodedToken>(tokens.accessToken);

  const user = {
    id: decoded.userId,
    email: decoded.email,
    name: "",
    pictureUrl: undefined,
    isAdmin: decoded.accesses?.includes("admin"),
  };

  userStore.set(user, remember);
  return user;
}

export async function fetchAndUpdateCurrentUser(): Promise<MeResponse | null> {
  try {
    const meUser: MeResponse | null = await getMeAPI(); // getMeAPI returns Promise<MeResponse>

    if (meUser) {
      userStore.update((currentUser) => {
        if (!currentUser) return meUser;
        return {
          ...currentUser,
          id: meUser.id,
          email: meUser.email,
          name: meUser.name,
          pictureUrl: meUser.pictureUrl,
          isAdmin: meUser.isAdmin,
        };
      });
      return meUser;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    throw error;
  }
}

export async function logout() {
  authStore.clear();
  userStore.clear();
}

export async function getToken(): Promise<{ accessToken: string } | null> {
  let tokens: any;
  authStore.subscribe((value) => (tokens = value))();

  if (!tokens) return null;

  // Check if access token is expired
  const decoded = jwtDecode(tokens.accessToken);
  const isExpired = decoded.exp && decoded.exp < Date.now() / 1000;

  if (!isExpired) {
    return { accessToken: tokens.accessToken };
  }

  try {
    const response: RefreshTokenResponse = await authRefreshAPI({
      refresh_token: tokens.refreshToken,
    });
    if (response.access_token) {
      authStore.updateAccessToken(response.access_token);
      return { accessToken: response.access_token };
    }
  } catch (error) {
    logout();
    throw new Error("Session expired");
  }

  return null;
}
