import { buildFindOptions, buildUpdateOptions } from "./build-options.util.js";

describe("buildFindOptions", () => {
  it("should return an empty object when no options are provided", () => {
    const result = buildFindOptions({
      collection: "users",
      filter: {},
    });
    expect(result).toEqual({});
  });

  it("should map projection to FindOptions", () => {
    const result = buildFindOptions({
      collection: "users",
      filter: {},
      projection: { name: 1, email: 1 },
    });
    expect(result.projection).toEqual({ name: 1, email: 1 });
  });

  it("should map sort to FindOptions", () => {
    const result = buildFindOptions({
      collection: "users",
      filter: {},
      sort: { createdAt: -1 },
    });
    expect(result.sort).toEqual({ createdAt: -1 });
  });

  it("should map limit and skip to FindOptions", () => {
    const result = buildFindOptions({
      collection: "users",
      filter: {},
      limit: 10,
      skip: 20,
    });
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(20);
  });
});

describe("buildUpdateOptions", () => {
  it("should return an empty object when upsert is not provided", () => {
    const result = buildUpdateOptions({});
    expect(result).toEqual({});
  });

  it("should map upsert to UpdateOptions", () => {
    const result = buildUpdateOptions({ upsert: true });
    expect(result.upsert).toBe(true);
  });
});
