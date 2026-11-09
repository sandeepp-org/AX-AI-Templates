export interface FileDescriptor {
  name: string;
  type: string;
  size: number;
}

export interface SignedUploadRequest {
  files: FileDescriptor[];
  prefix?: string;
}

export interface SignedUploadInstruction {
  name: string;
  size: number;
  type: string;
  objectPath: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  method: "PUT" | "POST";
  expiresAt: string;
}

export interface PdfUploadConstraints {
  maxFiles: number;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
}

export const DEFAULT_PDF_UPLOAD_CONSTRAINTS: PdfUploadConstraints = {
  maxFiles: 10,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: ["application/pdf"],
};

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export function sanitizeFileName(name: string): string {
  if (!name) return "document";
  const lower = name.toLowerCase();
  const stripped = lower.replace(/[^a-z0-9.-]+/g, "-");
  const normalized = stripped.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return normalized || "document";
}

export function ensurePdfExtension(name: string): string {
  return name.endsWith(".pdf") ? name : `${name}.pdf`;
}

export function validatePdfFiles(
  files: FileDescriptor[],
  constraints: PdfUploadConstraints = DEFAULT_PDF_UPLOAD_CONSTRAINTS
): void {
  if (!Array.isArray(files) || files.length === 0) {
    throw new UploadValidationError(
      "At least one file descriptor is required."
    );
  }
  if (files.length > constraints.maxFiles) {
    throw new UploadValidationError(
      `Too many files. Maximum allowed is ${constraints.maxFiles}.`
    );
  }

  files.forEach((file, index) => {
    if (!file || typeof file !== "object") {
      throw new UploadValidationError(
        `Invalid file descriptor at index ${index}.`
      );
    }
    if (typeof file.name !== "string" || !file.name.trim()) {
      throw new UploadValidationError(
        `File name is required (index ${index}).`
      );
    }
    if (
      typeof file.type !== "string" ||
      !constraints.allowedMimeTypes.includes(file.type)
    ) {
      throw new UploadValidationError(
        `Unsupported file type for "${file.name}". Only PDF files are allowed.`
      );
    }
    if (typeof file.size !== "number" || Number.isNaN(file.size)) {
      throw new UploadValidationError(`Invalid file size for "${file.name}".`);
    }
    if (file.size <= 0) {
      throw new UploadValidationError(`"${file.name}" is empty.`);
    }
    if (file.size > constraints.maxFileSizeBytes) {
      throw new UploadValidationError(
        `"${file.name}" exceeds the ${Math.round(
          constraints.maxFileSizeBytes / (1024 * 1024)
        )} MB limit.`
      );
    }
  });
}

export function cleanObjectPrefix(prefix?: string): string | undefined {
  if (!prefix) return undefined;
  const sanitized = prefix
    .replace(/[^a-zA-Z0-9/_-]+/g, "")
    .replace(/\/+/g, "/");
  return sanitized ? sanitized.replace(/\/$/, "") : undefined;
}
