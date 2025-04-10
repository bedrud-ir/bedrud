import { authStore } from './stores/auth.store';
import { userStore } from './stores/user.store';
import { authRefresh, loginAPI, registerAPI } from './api';
import { jwtDecode } from 'jwt-decode';

// Add this interface to define the JWT payload structure
interface DecodedToken {
  userId: string;
  email: string;
  accesses: string[];
  provider: string;
  exp: number;
  iat: number;
}

export async function login(email: string, password: string, remember: boolean = false) {
    const response = await loginAPI(email, password);
    console.log(response)
    if (response.tokens && response.user) {
        authStore.setTokens(response.tokens, remember);
        userStore.set(response.user, remember);
        return response.user;
    }
    throw new Error('Login failed');
}

export async function register(email: string, password: string, name: string) {
    try {
        const response = await registerAPI({ email, password, name });
        console.log(response);
        
        if (response.access_token && response.refresh_token) {
            // Convert snake_case response to camelCase for the auth store
            const tokens = {
                accessToken: response.access_token,
                refreshToken: response.refresh_token
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
                isAdmin: decoded.accesses?.includes('admin')
            };
            
            // Set user in user store
            userStore.set(user);
            
            return user;
        }
        
        throw new Error('Registration failed');
    } catch (error) {
        // Re-throw the error with the specific message from the API
        throw error;
    }
}

export async function logout() {
    authStore.clear();
    userStore.clear();
}

export async function getToken(): Promise<{ accessToken: string } | null> {
    let tokens: any;
    authStore.subscribe(value => tokens = value)();

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
        throw new Error('Session expired');
    }

    return null;
}
