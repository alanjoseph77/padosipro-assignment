import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// If a logged-in request comes back 401 (token expired), log the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && authToken) onUnauthorized?.();
    return Promise.reject(err);
  }
);

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
  status?: number;
};

// Turns any error into { code, message, fields } that screens can show
export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: ApiError } | undefined;
    if (data?.error) return { ...data.error, status: err.response?.status };
    if (err.code === "ECONNABORTED") {
      return { code: "TIMEOUT", message: "The server took too long to respond. Please try again." };
    }
    if (!err.response) {
      return { code: "NETWORK", message: "Can't reach the server. Check your connection and try again." };
    }
  }
  return { code: "UNKNOWN", message: "Something went wrong. Please try again." };
}
