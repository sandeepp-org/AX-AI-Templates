import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";
import type {
  IRestClientConfig,
  IRestClient,
  IRequestConfig,
} from "./types.js";
import { RestClientError } from "./types.js";

/** How long a request may take when the client's config gives no timeout, in milliseconds. */
const DEFAULT_TIMEOUT = 30_000;

/**
 * Simple REST client implementation for frontend
 */
class RestClient implements IRestClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;
  private authToken: string | null = null;
  private axiosInstance: AxiosInstance;
  private interceptorIds: number[] = [];

  constructor(config: IRestClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: this.headers,
    });
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.headers };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    config?: IRequestConfig
  ): Promise<T> {
    try {
      const requestConfig: AxiosRequestConfig = {
        method,
        url: path,
        headers: {
          ...this.getHeaders(),
          ...(config?.headers ?? {}),
        },
        ...config,
      };

      if (data !== undefined && data !== null) {
        requestConfig.data = data;
      }

      const response = await this.axiosInstance.request<T>(requestConfig);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;
      const message = axiosError.message || "Request failed";

      const restClientError = new RestClientError(message, statusCode, error);

      throw restClientError;
    }
  }

  async get<T>(path: string, config?: IRequestConfig): Promise<T> {
    return this.request<T>("GET", path, null, config);
  }

  async post<T>(
    path: string,
    data?: unknown,
    config?: IRequestConfig
  ): Promise<T> {
    return this.request<T>("POST", path, data, config);
  }

  async put<T>(
    path: string,
    data?: unknown,
    config?: IRequestConfig
  ): Promise<T> {
    return this.request<T>("PUT", path, data, config);
  }

  async patch<T>(
    path: string,
    data?: unknown,
    config?: IRequestConfig
  ): Promise<T> {
    return this.request<T>("PATCH", path, data, config);
  }

  async delete<T>(path: string, config?: IRequestConfig): Promise<T> {
    return this.request<T>("DELETE", path, undefined, config);
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  removeAuthToken(): void {
    this.authToken = null;
  }

  addRequestInterceptor(
    onFulfilled?: (
      config: import("axios").InternalAxiosRequestConfig
    ) =>
      | import("axios").InternalAxiosRequestConfig
      | Promise<import("axios").InternalAxiosRequestConfig>,
    onRejected?: (error: unknown) => unknown
  ): number {
    const id = this.axiosInstance.interceptors.request.use(
      onFulfilled,
      onRejected
    );
    this.interceptorIds.push(id);
    return id;
  }

  addResponseInterceptor(
    onFulfilled?: (
      response: import("axios").AxiosResponse
    ) => import("axios").AxiosResponse | Promise<import("axios").AxiosResponse>,
    onRejected?: (error: AxiosError) => unknown
  ): number {
    const id = this.axiosInstance.interceptors.response.use(
      onFulfilled,
      onRejected
    );
    this.interceptorIds.push(id);
    return id;
  }

  removeInterceptor(id: number): void {
    this.axiosInstance.interceptors.request.eject(id);
    this.axiosInstance.interceptors.response.eject(id);
    this.interceptorIds = this.interceptorIds.filter((i) => i !== id);
  }
}

// Shared client with proper config comparison
class SharedClient {
  private cache = new Map<string, IRestClient>();

  get(key: string, config: IRestClientConfig): IRestClient {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const client = new RestClient(config);
    this.cache.set(key, client);
    return client;
  }

  clear(): void {
    this.cache.clear();
  }
}

const clientCache = new SharedClient();

export function getSharedRestClient(config: IRestClientConfig): IRestClient {
  const cacheKey = JSON.stringify(config);
  return clientCache.get(cacheKey, config);
}

export function setSharedAuthToken(
  token: string,
  config: IRestClientConfig
): void {
  const client = getSharedRestClient(config);
  client.setAuthToken(token);
}

export function clearSharedAuthToken(config: IRestClientConfig): void {
  const client = getSharedRestClient(config);
  client.removeAuthToken();
}

export function resetSharedRestClients(): void {
  clientCache.clear();
}
