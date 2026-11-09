import type { CreateSseEndpointOptions } from "../types.js";

type SseDoc = NonNullable<CreateSseEndpointOptions["openApi"]>;

const SSE_DOCS: SseDoc[] = [];

// Records SSE endpoint OpenAPI metadata for later Swagger generation.
const registerSseDoc = (doc: SseDoc): void => {
  SSE_DOCS.push(doc);
};

// Returns all registered SSE docs in insertion order.
const listSseDocs = (): SseDoc[] => {
  const docs = [...SSE_DOCS];
  return docs;
};

// Clears all registered SSE docs (intended for tests).
const clearSseDocs = (): void => {
  SSE_DOCS.length = 0;
};

export { registerSseDoc, listSseDocs, clearSseDocs };
