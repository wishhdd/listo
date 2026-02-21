import { notifyError } from "../utils/notify";
import { triggerUnauthorized } from "./apiEvents";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  status: number;
  errors?: { message?: string; [key: string]: unknown };

  constructor(
    message: string,
    status: number,
    errors?: { message?: string; [key: string]: unknown }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
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
      triggerUnauthorized();
      throw new ApiError("Unauthorized", 401);
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Игнорируем ошибку парсинга, используем дефолтный текст
      }

      throw new ApiError(
        errorData?.message || response.statusText || "Ошибка сервера",
        response.status,
        errorData?.errors
      );
    }

    // Для успешных ответов ожидаем JSON
    // Если сервер вернет 204 No Content, response.json() упадет.
    // Добавим проверку на 204.
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    notifyError("Не удалось выполнить запрос. Проверьте интернет.");
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
