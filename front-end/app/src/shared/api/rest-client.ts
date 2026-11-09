import { getSharedRestClient, type IRestClient } from "@canopy/frontend-utils";

/** The path every API route lives under; the dev server forwards it to the back-end (see vite.config.ts). */
const API_BASE_URL = "/api/v1";

/** What every API route answers: the value in `data` on success, the message in `error` on failure. */
type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
};

/** The one REST client the app talks to its API through. */
const apiClient = (): IRestClient =>
  getSharedRestClient({ baseURL: API_BASE_URL });

// Unwraps an API answer, turning a failure envelope into a thrown error.
const unwrap = <T>(envelope: ApiEnvelope<T>): T => {
  if (envelope.error !== null || envelope.data === null) {
    throw new Error(envelope.error ?? "The API answered with no data");
  }
  return envelope.data;
};

/** GETs an API path and returns the value inside the response envelope. */
const apiGet = async <T>(path: string): Promise<T> =>
  unwrap(await apiClient().get<ApiEnvelope<T>>(path));

export { apiGet, API_BASE_URL };
export type { ApiEnvelope };
