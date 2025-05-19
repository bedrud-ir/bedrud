import { authStore } from "./stores/auth.store";
import { userStore } from "./stores/user.store";
import { authFetch, authRefresh, loginAPI, registerAPI } from "./api";
import { jwtDecode } from "jwt-decode";

// Add this interface to define the JWT payload structure
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
  const response = await loginAPI(email, password);
  console.log(response);
  if (response.tokens && response.user) {
    authStore.setTokens(response.tokens, remember);
    userStore.set(response.user, remember);
    return response.user;
  }
  throw new Error("Login failed");
}

export async function register(email: string, password: string, name: string) {
  try {
    const response = await registerAPI({ email, password, name });
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

// export async function handleGoogleCallback(queryString: string) {
//   const backendUrl = `${import.meta.env.VITE_BACKEND_API}/auth/google/callback${queryString}`;
//   try {
//     const res = await fetch(backendUrl, { credentials: "include" });
//     if (!res.ok) {
//       const errorData = await res
//         .json()
//         .catch(() => ({
//           message: "Google callback failed with status: " + res.status,
//         }));
//       throw new Error(errorData.message || "Google callback failed");
//     }
//     const response = await res.json();

//     if (response.token && response.user) {
//       const tokens = {
//         accessToken: response.token,
//         refreshToken: "", // Google OAuth typically doesn't return a refresh token in this step to the client
//       };
//       authStore.setTokens(tokens, true); // Assuming 'remember me' by default for OAuth

//       // Decode JWT to get user info with proper typing
//       const decoded = jwtDecode<DecodedToken>(tokens.accessToken);

//       // Create user object
//       const user = {
//         id: decoded.userId, // Or response.user.id, but JWT is the source of truth for session id
//         email: decoded.email, // Or response.user.email
//         name: response.user.name,
//         pictureUrl: response.user.avatarUrl,
//         provider: decoded.provider, // Or response.user.provider
//         isAdmin: decoded.accesses?.includes("admin"),
//       };

//       userStore.set(user, true); // Assuming 'remember me'

//       return user;
//     }
//     throw new Error("Google callback response is missing token or user data.");
//   } catch (error) {
//     console.error("Google callback error:", error);
//     // Re-throw the error to be handled by the UI
//     if (error instanceof Error) {
//       throw error;
//     }
//     throw new Error("An unknown error occurred during Google callback.");
//   }
// }

export async function storeTokenAndMinimalUser(
  accessToken: string,
  remember: boolean = true,
) {
  if (!accessToken) {
    throw new Error("No access token provided.");
  }

  const tokens = {
    accessToken: accessToken,
    // Assuming refresh token might be handled separately or not provided in this specific flow immediately
    // If your backend /auth/google/callback starts returning a refresh_token alongside the access_token in the redirect,
    // you'll need a way to get it here or adjust the flow. For now, an empty string is a placeholder.
    refreshToken: "", // Placeholder: Adjust if backend provides refresh token in redirect query
  };

  authStore.setTokens(tokens, remember);

  // Decode JWT to get user info
  const decoded = jwtDecode<DecodedToken>(tokens.accessToken);

  // Create a minimal user object from JWT
  // The name might not be in the JWT, or it might be. Adjust as per your JWT content.
  // `pictureUrl` and detailed `name` will be fetched by `fetchAndUpdateCurrentUser`.
  const user = {
    id: decoded.userId,
    email: decoded.email,
    name: "", // Placeholder, to be updated by /auth/me
    pictureUrl: undefined, // Placeholder
    isAdmin: decoded.accesses?.includes("admin"),
    // provider: decoded.provider // Also available from JWT
  };

  userStore.set(user, remember);
  return user;
}

// This type should match the user object structure returned by your /auth/me endpoint
interface MeResponseUser {
  id: string;
  email: string;
  name: string;
  pictureUrl?: string;
  isAdmin?: boolean;
  provider?: string;
  // Add any other fields your /auth/me endpoint returns for the user
}

export async function fetchAndUpdateCurrentUser(): Promise<MeResponseUser | null> {
  try {
    // authFetch already handles token attachment and errors
    const meUser = (await authFetch(
      `${import.meta.env.VITE_BACKEND_API}/auth/me`,
    )) as MeResponseUser;

    if (meUser) {
      // Update the user store with the more complete user information
      userStore.update((currentUser) => {
        if (!currentUser) return meUser; // Should ideally not happen if storeTokenAndMinimalUser ran
        return {
          ...currentUser, // Keep initial minimal info or override
          id: meUser.id,
          email: meUser.email,
          name: meUser.name,
          pictureUrl: meUser.pictureUrl,
          isAdmin: meUser.isAdmin,
          // provider: meUser.provider, // if backend sends it
        };
      });
      return meUser;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    // Optionally logout if /auth/me fails (e.g. token is invalid for some reason not caught by getToken)
    // await logout();
    throw error; // Re-throw to be handled by the caller (e.g., callback page)
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

  // Try to refresh the token
  try {
    const response = await authRefresh(tokens.refreshToken);
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
