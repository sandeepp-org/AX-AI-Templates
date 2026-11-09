import axios from 'axios';

import type {
  FileDescriptor,
  SignedUploadInstruction,
  SignedUploadRequest,
} from './pdfUtils';

const DEFAULT_SIGNED_URL_ENDPOINT = '/api/uploads/signed-url';

export interface SignedUploadRequestOptions {
  /** Custom endpoint that proxies to the GCS signed URL generator */
  endpoint?: string;
  /** Optional fetch implementation (defaults to global fetch) */
  fetchImpl?: typeof fetch;
  /** Additional headers to send with the request */
  headers?: Record<string, string>;
}

export async function getSignedUploadInstructions(
  files: FileDescriptor[],
  prefix?: string,
  options: SignedUploadRequestOptions = {}
): Promise<SignedUploadInstruction[]> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error('Fetch API is not available in the current environment.');
  }

  const endpoint = options.endpoint ?? DEFAULT_SIGNED_URL_ENDPOINT;
  const payload: SignedUploadRequest = { files, prefix };

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message ?? 'Unable to generate upload URLs. Please try again.');
  }

  const data = (await response.json()) as { files?: SignedUploadInstruction[] };
  if (!data.files || !Array.isArray(data.files) || data.files.length !== files.length) {
    throw new Error('Upload service returned unexpected response.');
  }

  return data.files;
}

export async function uploadFileToSignedUrl(
  file: File,
  instruction: SignedUploadInstruction
): Promise<void> {

  // This is for mocking storage, IT should be removed in production
  if (instruction.uploadUrl.startsWith('mock://')) {
    return;
  }

  try {
    await axios.request({
      url: instruction.uploadUrl,
      method: instruction.method,
      headers: instruction.uploadHeaders,
      data: file,
      maxBodyLength: Infinity,
    });
  } catch (error) {
    console.error('Failed to upload file to storage.', error);
    throw new Error('Failed to upload file to storage.');
  }
}

export async function extractErrorMessage(response: Response): Promise<string | null> {
  try {
    const data = await response.json();
    if (data && typeof data === 'object') {
      if ('error' in data && typeof (data as { error?: string }).error === 'string') {
        return (data as { error?: string }).error ?? null;
      }
      if ('message' in data && typeof (data as { message?: string }).message === 'string') {
        return (data as { message?: string }).message ?? null;
      }
    }
  } catch {
    // ignore JSON parse errors
  }
  return response.statusText || null;
}
