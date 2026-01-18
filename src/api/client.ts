const BASE_URL = import.meta.env.VITE_API_URL || "";

interface ApiError {
  message: string;
  errors?: Record<string, unknown>;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${
    endpoint.startsWith("/") ? endpoint : "/" + endpoint
  }`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  };
  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "Ошибка сервера") as Error &
        ApiError;
      error.errors = data.errors;
      throw error;
    }
    return data as T;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        throw error;
      }
    }
    console.error(`API Error (${url}):`, error);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
