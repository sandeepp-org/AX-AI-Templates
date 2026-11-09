import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * REST Client configuration
 */
export interface IRestClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Request configuration for individual requests
 */
export interface IRequestConfig extends Partial<AxiosRequestConfig> {
  headers?: Record<string, string>;
}

/**
 * REST Client error with additional context
 */
export class RestClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'RestClientError';
  }
}

/**
 * Generic REST Client interface
 */
export interface IRestClient {
  get<T>(path: string, config?: IRequestConfig): Promise<T>;
  post<T>(path: string, data?: unknown, config?: IRequestConfig): Promise<T>;
  put<T>(path: string, data?: unknown, config?: IRequestConfig): Promise<T>;
  patch<T>(path: string, data?: unknown, config?: IRequestConfig): Promise<T>;
  delete<T>(path: string, config?: IRequestConfig): Promise<T>;
  setAuthToken(token: string): void;
  removeAuthToken(): void;
  addRequestInterceptor(
    onFulfilled?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
    onRejected?: (error: unknown) => unknown
  ): number;
  addResponseInterceptor(
    onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: AxiosError) => unknown
  ): number;
  removeInterceptor(id: number): void;
}
