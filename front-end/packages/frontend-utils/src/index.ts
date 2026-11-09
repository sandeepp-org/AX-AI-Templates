// REST Client exports
export type { IRestClientConfig, IRestClient, IRequestConfig, RestClientError } from './rest/index.js';
export {
  getSharedRestClient,
  setSharedAuthToken,
  clearSharedAuthToken,
  resetSharedRestClients,
} from './rest/index';

// Upload utilities
export {
  DEFAULT_PDF_UPLOAD_CONSTRAINTS,
  type FileDescriptor,
  type PdfUploadConstraints,
  type SignedUploadInstruction,
  type SignedUploadRequest,
  UploadValidationError,
  sanitizeFileName,
  ensurePdfExtension,
  validatePdfFiles,
  cleanObjectPrefix,
} from './utils/pdfUtils';

export {
  getSignedUploadInstructions,
  uploadFileToSignedUrl,
  extractErrorMessage,
  type SignedUploadRequestOptions,
} from './utils/gcsUploads';
