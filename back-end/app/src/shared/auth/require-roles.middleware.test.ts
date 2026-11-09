import { Request, Response } from "express";
import { JwtTokens } from "@util/jwt-tokens";
import {
  createRequireRolesMiddleware,
  type RequireRolesOptions,
} from "./require-roles.middleware.js";

const SECRET = "a".repeat(32);

const runMiddleware = async (
  options: RequireRolesOptions,
  req: Partial<Request>,
  _res: Partial<Response> & { statusCode?: number; body?: unknown }
): Promise<{ statusCode: number; body: unknown; nextCalled: boolean }> => {
  let nextCalled = false;
  const next = (): void => {
    nextCalled = true;
  };

  const resWithCapture = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as Response & { statusCode: number; body: unknown };

  const middleware = createRequireRolesMiddleware(options);
  await middleware(
    req as Request,
    resWithCapture as Response,
    next as () => void
  );

  return {
    statusCode: resWithCapture.statusCode,
    body: resWithCapture.body,
    nextCalled,
  };
};

describe("createRequireRolesMiddleware", () => {
  it("returns 401 when no token is provided", async () => {
    const result = await runMiddleware(
      { requiredRoles: ["user"], secret: SECRET },
      { headers: {}, cookies: {} },
      {}
    );
    expect(result.statusCode).toBe(401);
    expect(result.body).toEqual({ data: null, error: "Unauthorized" });
    expect(result.nextCalled).toBe(false);
  });

  it("returns 401 when token is invalid or expired", async () => {
    const result = await runMiddleware(
      { requiredRoles: ["user"], secret: SECRET },
      {
        headers: { authorization: "Bearer invalid-token" },
        cookies: {},
      },
      {}
    );
    expect(result.statusCode).toBe(401);
    expect(result.body).toEqual({ data: null, error: "Invalid token" });
    expect(result.nextCalled).toBe(false);
  });

  it("returns 403 when token has wrong role", async () => {
    const token = await JwtTokens.signAccessToken(
      { sub: "u1", role: "user" },
      SECRET,
      { expiresIn: "15m" }
    );
    const result = await runMiddleware(
      { requiredRoles: ["admin"], secret: SECRET },
      {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      },
      {}
    );
    expect(result.statusCode).toBe(403);
    expect(result.body).toEqual({ data: null, error: "Forbidden" });
    expect(result.nextCalled).toBe(false);
  });

  it("calls next and attaches req.auth when token has correct role", async () => {
    const token = await JwtTokens.signAccessToken(
      { sub: "u1", role: "admin" },
      SECRET,
      { expiresIn: "15m" }
    );
    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {} as Record<string, string>,
    };
    const result = await runMiddleware(
      { requiredRoles: ["admin"], secret: SECRET },
      req,
      {}
    );
    expect(result.nextCalled).toBe(true);
    expect(
      (req as Request & { auth?: { sub: string; role: string } }).auth
    ).toEqual({
      sub: "u1",
      role: "admin",
    });
  });

  it("reads token from cookie when Authorization header is missing", async () => {
    const token = await JwtTokens.signAccessToken(
      { sub: "u2", role: "user" },
      SECRET,
      { expiresIn: "15m" }
    );
    const result = await runMiddleware(
      { requiredRoles: ["user"], secret: SECRET },
      {
        headers: {},
        cookies: { accessToken: token },
      },
      {}
    );
    expect(result.nextCalled).toBe(true);
  });
});
