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
        avatarUrl: undefined,
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
    avatarUrl: undefined,
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
          avatarUrl: meUser.avatarUrl,
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

// -------------------------------------------------
// Passkey (WebAuthn) Helpers
// -------------------------------------------------

import {
  passkeyLoginBeginAPI,
  passkeyLoginFinishAPI,
  passkeyRegisterBeginAPI,
  passkeyRegisterFinishAPI,
  passkeySignupBeginAPI,
  passkeySignupFinishAPI,
} from "./api/auth";

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function passkeyLogin() {
  try {
    const options = await passkeyLoginBeginAPI();
    const challenge = base64ToBuffer(options.challenge);

    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: options.rpId,
        userVerification: "preferred",
      },
    })) as PublicKeyCredential;

    if (!credential) throw new Error("failed");

    const response = credential.response as AuthenticatorAssertionResponse;

    const data = {
      credentialId: bufferToBase64(credential.rawId),
      clientDataJSON: bufferToBase64(response.clientDataJSON),
      authenticatorData: bufferToBase64(response.authenticatorData),
      signature: bufferToBase64(response.signature),
    };

    const loginResponse = await passkeyLoginFinishAPI(data);

    if (loginResponse.tokens && loginResponse.user) {
      authStore.setTokens(loginResponse.tokens);
      userStore.set(loginResponse.user);
      return loginResponse.user;
    }
    throw new Error("failed");
  } catch (err) {
    console.error("Passkey login error:", err);
    throw new Error("failed");
  }
}

export async function passkeyRegister() {
  try {
    const options = await passkeyRegisterBeginAPI();
    const challenge = base64ToBuffer(options.challenge);
    const userHandle = base64ToBuffer(options.user.id);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: options.rp,
        user: {
          id: userHandle,
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          userVerification: "preferred",
          residentKey: "preferred",
        },
      },
    })) as PublicKeyCredential;

    if (!credential) throw new Error("failed");

    const response = credential.response as AuthenticatorAttestationResponse;

    const data = {
      clientDataJSON: bufferToBase64(response.clientDataJSON),
      attestationObject: bufferToBase64(response.attestationObject),
    };

    return await passkeyRegisterFinishAPI(data);
  } catch (err) {
    console.error("Passkey registration error:", err);
    throw new Error("failed");
  }
}

export async function passkeySignup(email: string, name: string) {
  try {
    const options = await passkeySignupBeginAPI({ email, name });
    const challenge = base64ToBuffer(options.challenge);
    const userHandle = base64ToBuffer(options.user.id);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: options.rp,
        user: {
          id: userHandle,
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          userVerification: "preferred",
          residentKey: "preferred",
        },
      },
    })) as PublicKeyCredential;

    if (!credential) throw new Error("failed");

    const response = credential.response as AuthenticatorAttestationResponse;

    const data = {
      clientDataJSON: bufferToBase64(response.clientDataJSON),
      attestationObject: bufferToBase64(response.attestationObject),
    };

    const loginResponse = await passkeySignupFinishAPI(data);
    if (loginResponse.tokens && loginResponse.user) {
      authStore.setTokens(loginResponse.tokens);
      userStore.set(loginResponse.user);
      return loginResponse.user;
    }
    throw new Error("failed");
  } catch (err) {
    console.error("Passkey signup error:", err);
    throw new Error("failed");
  }
}
