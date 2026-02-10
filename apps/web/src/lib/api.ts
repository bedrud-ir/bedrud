import { getToken } from "./auth";
import { userStore } from "./stores/user.store";
import { debugStore } from "./stores/debug.store";

export const baseURL = import.meta.env.VITE_BACKEND_API || "/api";

export async function authFetch(url: string, options: any = {}) {
  debugStore.debug(`API Request: ${options.method || 'GET'} ${url}`, 'API');
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
    credentials: "include",
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    } catch (e: any) {
      if (e.message && !e.message.startsWith('HTTP error!')) {
        throw e;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  if (doParseJson) {
    return response.json();
  }

  return response;
}
