import type { AgenticMemory } from "../agentic-memory.js";
import { MemoryToolValidationError } from "../errors.js";
import type {
  DeleteMemoryInput,
  MemoryEntry,
  RetrieveMemoryInput,
  SaveMemoryInput,
} from "../types.js";
import {
  deleteMemoryToolSchema,
  retrieveMemoryToolSchema,
  saveMemoryToolSchema,
} from "./memory-tools.schema.js";

type ToolAuditEvent =
  | { type: "save"; input: SaveMemoryInput }
  | { type: "retrieve"; input: RetrieveMemoryInput }
  | { type: "delete"; input: DeleteMemoryInput };

type ToolHooks = {
  onAudit?: (event: ToolAuditEvent) => void;
};

/**
 * Validates and executes save memory tool input.
 */
const toolSaveMemory = async (
  service: AgenticMemory,
  input: unknown,
  hooks?: ToolHooks
): Promise<MemoryEntry> => {
  const parsed = saveMemoryToolSchema.safeParse(input);
  if (!parsed.success) {
    throw new MemoryToolValidationError(
      "Invalid save_memory input",
      parsed.error
    );
  }
  hooks?.onAudit?.({ type: "save", input: parsed.data });
  return service.saveMemory(parsed.data);
};

/**
 * Validates and executes retrieve memory tool input.
 */
const toolRetrieveMemory = async (
  service: AgenticMemory,
  input: unknown,
  hooks?: ToolHooks
): Promise<MemoryEntry[]> => {
  const parsed = retrieveMemoryToolSchema.safeParse(input);
  if (!parsed.success) {
    throw new MemoryToolValidationError(
      "Invalid retrieve_memory input",
      parsed.error
    );
  }
  hooks?.onAudit?.({ type: "retrieve", input: parsed.data });
  return service.retrieveMemory(parsed.data);
};

/**
 * Validates and executes delete memory tool input.
 */
const toolDeleteMemory = async (
  service: AgenticMemory,
  input: unknown,
  hooks?: ToolHooks
): Promise<void> => {
  const parsed = deleteMemoryToolSchema.safeParse(input);
  if (!parsed.success) {
    throw new MemoryToolValidationError(
      "Invalid delete_memory input",
      parsed.error
    );
  }
  hooks?.onAudit?.({ type: "delete", input: parsed.data });
  await service.deleteMemory(parsed.data);
};

/**
 * Creates a ready-to-register tool set for agent runtimes.
 */
const createMemoryTools = (service: AgenticMemory, hooks?: ToolHooks) => {
  return {
    save_memory: (input: unknown) => toolSaveMemory(service, input, hooks),
    retrieve_memory: (input: unknown) =>
      toolRetrieveMemory(service, input, hooks),
    delete_memory: (input: unknown) => toolDeleteMemory(service, input, hooks),
  };
};

export {
  toolSaveMemory,
  toolRetrieveMemory,
  toolDeleteMemory,
  createMemoryTools,
};
