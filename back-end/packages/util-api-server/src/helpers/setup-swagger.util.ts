import type { Application, InternalConfig, RouteDefinition } from "../types.js";

import swaggerUi from "swagger-ui-express";

import { listSseDocs } from "./sse-openapi-registry.util.js";

import { HEALTH_ENDPOINT_PATH } from "../constants.js";

type OpenApiPathItem = {
  post?: Record<string, unknown>;
  get?: Record<string, unknown>;
  put?: Record<string, unknown>;
  patch?: Record<string, unknown>;
  delete?: Record<string, unknown>;
};

type OpenApiTag = {
  name: string;
};

type OpenApiSpec = {
  openapi: string;
  info: { title: string; description: string; version: string };
  tags: OpenApiTag[];
  paths: Record<string, OpenApiPathItem>;
  components: Record<string, unknown>;
};

const RESPONSE_ENVELOPE_SCHEMA = {
  type: "object",
  properties: {
    data: { nullable: true, description: "Response payload (null on error)" },
    error: {
      type: "string",
      nullable: true,
      description: "Error message (null on success)",
    },
  },
} as const;

/**
 * Builds a minimal OpenAPI operation object for a JSON route using the standard response envelope.
 */
const buildJsonOperationObject = (
  route: RouteDefinition
): Record<string, unknown> => {
  const method = route.method ?? "POST";

  return {
    tags: [route.version],
    summary: `${method} ${route.path}`,
    requestBody: {
      required: false,
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    },
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": { schema: RESPONSE_ENVELOPE_SCHEMA },
        },
      },
      "500": {
        description: "Handler error",
        content: {
          "application/json": { schema: RESPONSE_ENVELOPE_SCHEMA },
        },
      },
    },
  };
};

// Builds a PathItem that contains one operation keyed by the route's method.
const buildJsonRoutePathItem = (route: RouteDefinition): OpenApiPathItem => {
  const method = (
    route.method ?? "POST"
  ).toLowerCase() as keyof OpenApiPathItem;
  const operation = buildJsonOperationObject(route);
  const pathItem: OpenApiPathItem = { [method]: operation };

  return pathItem;
};

// Builds an OpenAPI PathItem for an SSE endpoint.
const buildSsePathItem = (
  version: string,
  summary?: string
): OpenApiPathItem => {
  return {
    get: {
      tags: [version],
      summary: summary ?? "SSE stream",
      responses: {
        "200": {
          description: "Event stream",
          content: {
            "text/event-stream": {
              schema: { type: "string" },
            },
          },
        },
      },
    },
  };
};

/**
 * Builds the OpenAPI path item describing the health check endpoint.
 */
const buildHealthPathItem = (): OpenApiPathItem => {
  return {
    get: {
      summary: "Health check",
      responses: {
        "200": {
          description: "Server is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      uptime: { type: "number", example: 42.5 },
                    },
                  },
                  error: { type: "string", nullable: true, example: null },
                },
              },
            },
          },
        },
      },
    },
  };
};

// Collects unique version strings from routes and SSE docs into OpenAPI tags.
const collectTags = (config: InternalConfig): OpenApiTag[] => {
  const versionSet = new Set<string>();

  for (const route of config.routes) {
    versionSet.add(route.version);
  }
  for (const doc of listSseDocs()) {
    versionSet.add(doc.version);
  }

  const tags = [...versionSet].map((v) => ({ name: v }));
  return tags;
};

const generateOpenApiSpec = (config: InternalConfig): OpenApiSpec => {
  const paths: Record<string, OpenApiPathItem> = {};

  paths[HEALTH_ENDPOINT_PATH] = buildHealthPathItem();

  for (const route of config.routes) {
    const fullPath = `${config.apiPrefix}/${route.version}${route.path}`;
    paths[fullPath] = buildJsonRoutePathItem(route);
  }

  for (const doc of listSseDocs()) {
    const fullPath = `${config.apiPrefix}/${doc.version}${doc.path}`;
    paths[fullPath] = buildSsePathItem(doc.version, doc.summary);
  }

  return {
    openapi: "3.0.3",
    info: {
      title: config.swaggerTitle,
      description: config.swaggerDescription,
      version: config.swaggerVersion,
    },
    tags: collectTags(config),
    paths,
    components: {},
  };
};

const setupSwagger = (app: Application, config: InternalConfig): void => {
  const isDisabled = !config.swaggerEnabled;
  if (isDisabled) {
    return;
  }

  const spec = generateOpenApiSpec(config);

  app.use(
    config.swaggerPath,
    swaggerUi.serve as unknown as import("express").RequestHandler[],
    swaggerUi.setup(spec) as unknown as import("express").RequestHandler
  );

  config.logger.info(`Swagger UI available at ${config.swaggerPath}`);
};

export { setupSwagger, generateOpenApiSpec };
