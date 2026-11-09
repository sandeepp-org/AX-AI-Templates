import "dotenv/config";

import { ApiServer } from "@util/api-server";

import express from "express";

import { logger, initLogger } from "./shared/logger/logger.js";
import { secrets, initSecrets } from "./shared/secrets/secret.js";


await initLogger();
await initSecrets();

const PORT = Number(process.env.PORT ?? "3001");

const server = ApiServer.create({
  config: {
    PORT,
    SWAGGER_ENABLED: true,
    SWAGGER_TITLE: "Nexus API",
    SWAGGER_DESCRIPTION: "Nexus application API",
  },
  logger,
  onAppStart: async () => {
    logger.info("App bootstrap complete");
  },
  onAppStop: async () => {
    try {
    } catch (err) {
      logger.warn("Database close skipped or failed", { error: String(err) });
    }
    try {
    } catch (err) {
      logger.warn("Redis close skipped or failed", { error: String(err) });
    }
    await secrets.close();
    logger.info("App shutting down");
  },
  routes: [],
});
logger.info("Server created");

const router = express.Router();
server.expressApp.use("/api", router);

await server.start();
