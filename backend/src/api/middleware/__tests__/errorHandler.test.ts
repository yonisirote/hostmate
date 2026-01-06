import type { Request, Response, NextFunction } from "express";
import { vi } from "vitest";
import { errorHandler } from "../errorHandler.js";
import { HttpError } from "../../errors.js";

function createMockResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const res = {
    status,
    json,
    headersSent: false,
  } as unknown as Response & { headersSent: boolean };
  return { res, status, json };
}

function createNextMock() {
  const nextMock = vi.fn();
  return {
    next: nextMock as unknown as NextFunction,
    nextMock,
  };
}

describe("errorHandler middleware", () => {
  test("responds with HttpError status and message", () => {
    const { res, status, json } = createMockResponse();
    const { next, nextMock } = createNextMock();
    const err = new HttpError(400, "Bad request");

    errorHandler(err, {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: "Bad request" });
    expect(nextMock).not.toHaveBeenCalled();
  });

  test("normalizes unexpected errors to 500 internal error and logs", () => {
    const { res, status, json } = createMockResponse();
    const { next, nextMock } = createNextMock();
    const err = new Error("Boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(err, {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(nextMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("delegates to next when headers already sent", () => {
    const { res } = createMockResponse();
    res.headersSent = true;
    const { next, nextMock } = createNextMock();
    const err = new HttpError(422, "Cannot process");

    errorHandler(err, {} as Request, res, next);

    expect(nextMock).toHaveBeenCalledWith(err);
  });

  test("masks 500-level HttpErrors with generic message", () => {
    const { res, status, json } = createMockResponse();
    const { next, nextMock } = createNextMock();
    const err = new HttpError(503, "Service exploded");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(err, {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(nextMock).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(err);

    consoleSpy.mockRestore();
  });
});
