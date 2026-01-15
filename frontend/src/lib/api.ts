import { getToken } from "./auth";
import { userStore } from "./stores/user.store";

export const baseURL = import.meta.env.VITE_BACKEND_API;

export async function authFetch(url: string, options: any = {}) {
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
      Authorization: `Bearer ${token?.accessToken ?? ""}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (doParseJson) {
    return response.json();
  }

  return response;
}

export async function optionalAuthFetch(url: string, options: any = {}) {
  let token;
  try {
    token = await getToken();
  } catch (e) {
    console.log("Proceeding without auth token");
  }

  const doParseJson = options?.parseJson !== false;
  if (options.hasOwnProperty("parseJson")) {
    delete (options as any).parseJson;
  }

  const headers = { ...options?.headers };
  if (token?.accessToken) {
    headers.Authorization = `Bearer ${token.accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  if (doParseJson) {
    return response.json();
  }

  return response;
}
