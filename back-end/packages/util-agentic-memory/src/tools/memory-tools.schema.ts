import { z } from "zod";

import { MemoryType } from "../types.js";

const MemoryTypeSchema = z.nativeEnum(MemoryType);

const saveMemoryToolSchema = z.object({
  memoryKey: z.string().min(1).optional(),
  agentId: z.string().min(1),
  type: MemoryTypeSchema,
  importance: z.number().int().min(1).max(10).optional(),
  payloadJson: z.record(z.string(), z.unknown()),
  ttlMs: z.number().int().positive().optional(),
  expectedDocumentVersion: z.number().int().nonnegative().optional(),
});

const retrieveMemoryToolSchema = z.object({
  agentId: z.string().min(1),
  query: z.string().optional(),
  types: z.array(MemoryTypeSchema).optional(),
  topK: z.number().int().positive().optional(),
});

const deleteMemoryToolSchema = z.object({
  agentId: z.string().min(1),
  id: z.string().min(1),
});

export {
  saveMemoryToolSchema,
  retrieveMemoryToolSchema,
  deleteMemoryToolSchema,
  MemoryTypeSchema,
};
