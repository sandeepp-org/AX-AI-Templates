import { createMongodbTransport } from "./mongodb.transport.js";

const MONGO_URI_FOR_TRANSPORT =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/winston-test";

describe("createMongodbTransport", () => {
  it("should return a transport instance", () => {
    const transport = createMongodbTransport({
      type: "mongodb",
      uri: MONGO_URI_FOR_TRANSPORT,
    });
    expect(transport).toBeDefined();
  });

  it("should use default collection when not specified", () => {
    const transport = createMongodbTransport({
      type: "mongodb",
      uri: MONGO_URI_FOR_TRANSPORT,
    });
    expect(transport).toBeDefined();
  });
});
