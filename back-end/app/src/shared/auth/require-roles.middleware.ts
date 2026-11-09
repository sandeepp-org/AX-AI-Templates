import type { Request, Response, NextFunction } from "express";
import { JwtTokens } from "@util/jwt-tokens";

/** Options for createRequireRolesMiddleware. Extracts JWT, verifies, attaches req.auth with sub and role. */
type RequireRolesOptions = {
  requiredRoles: string[];
  secret: string;
  getToken?: (req: Request) => string | null;
};

/** Default: get token from Authorization Bearer header or cookies. */
const defaultGetToken = (req: Request): string | null => {
  const auth = req.headers?.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return req.cookies?.accessToken ?? null;
};

/** Verifies JWT, checks role, attaches req.auth = { sub, role } and calls next. Returns 401/403 on failure. */
const createRequireRolesMiddleware = (
  options: RequireRolesOptions
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  const { requiredRoles, secret, getToken = defaultGetToken } = options;

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({ data: null, error: "Unauthorized" });
      return;
    }

    try {
      const payload = await JwtTokens.verifyAccessToken(token, secret);
      const hasRole = requiredRoles.includes(payload.role);
      if (!hasRole) {
        res.status(403).json({ data: null, error: "Forbidden" });
        return;
      }
      (req as Request & { auth?: { sub: string; role: string } }).auth = {
        sub: payload.sub,
        role: payload.role,
      };
      next();
    } catch {
      res.status(401).json({ data: null, error: "Invalid token" });
    }
  };
};

export { createRequireRolesMiddleware };
export type { RequireRolesOptions };
