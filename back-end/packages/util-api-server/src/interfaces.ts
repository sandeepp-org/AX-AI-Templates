import type { Application } from "./types.js";

interface ApiServerContract {
  readonly expressApp: Application;
  readonly port: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export type { ApiServerContract };
