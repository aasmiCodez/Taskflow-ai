import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiMessageResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type JsonBody = unknown;

interface RequestOptions extends Omit<AxiosRequestConfig, "data" | "url"> {
  body?: JsonBody;
  accessToken?: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown, fallback = "Request failed."): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiMessageResponse>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || (options.body !== undefined ? "POST" : "GET");

  try {
    const response = await axios.request<T>({
      ...options,
      url: `${API_URL}${path}`,
      method,
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
        ...(options.headers || {}),
      },
      data: options.body,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiMessageResponse>;
      const status = axiosError.response?.status ?? 500;
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Request failed.";
      throw new ApiError(message, status);
    }

    throw error;
  }
}

export { API_URL };
