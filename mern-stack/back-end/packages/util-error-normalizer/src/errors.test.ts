import {
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from "./errors.js";

describe("BaseAppError and subclasses", () => {
  it("should create a ValidationError with expected properties", () => {
    const details = { field: "email" };
    const error = new ValidationError("Invalid email", details);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
    expect(error.details).toEqual(details);
  });

  it("should create a NotFoundError with expected properties", () => {
    const error = new NotFoundError("User not found");

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });

  it("should create an UnauthorizedError with expected properties", () => {
    const error = new UnauthorizedError("Unauthorized");

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.status).toBe(401);
  });

  it("should create a ForbiddenError with expected properties", () => {
    const error = new ForbiddenError("Forbidden");

    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.status).toBe(403);
  });

  it("should create a ConflictError with expected properties", () => {
    const error = new ConflictError("Conflict");

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.code).toBe("CONFLICT");
    expect(error.status).toBe(409);
  });

  it("should create a RateLimitError with expected properties", () => {
    const error = new RateLimitError("Too many requests");

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.code).toBe("RATE_LIMIT");
    expect(error.status).toBe(429);
  });

  it("should create an InternalError with expected properties", () => {
    const error = new InternalError("Unexpected");

    expect(error).toBeInstanceOf(InternalError);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.status).toBe(500);
  });
});
