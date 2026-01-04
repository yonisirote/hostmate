import jwt, { type JwtPayload } from "jsonwebtoken";
import argon2 from "argon2";
import crypto from "crypto";
import { config } from "./config/config.js";
import type { Request } from "express";
import { HttpError } from "./api/errors.js";


type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function generateAccessToken(userId: string, secret: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + config.jwt.defaultExpiry;
  const tokenPayload: payload = {
    iss: config.jwt.issuer,
    sub: userId,
    iat: issuedAt,
    exp: expiresAt,
  };
  const accessToken = jwt.sign(tokenPayload, secret, { algorithm: "HS256" });
  return accessToken;
}

export function validateToken(token: string, secret: string) {
  try {
    const decodedPayload = jwt.verify(token, secret) as JwtPayload;
    return { valid: true, expired: false, payload: decodedPayload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, expired: true, payload: null };
    }
    return { valid: false, expired: false, payload: null };
  }

}

export function getBearerToken(req: Request): string{
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new HttpError(401, "Invalid authorization header");
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new HttpError(401, "Invalid authorization header");
  }
  return token;
}

export function authenticateUserId(req: Request){
  const token = getBearerToken(req);
  try {
    const decoded = validateToken(token, config.jwt.secret);
    if (!decoded.valid || decoded.expired || !decoded.payload) {
      throw new Error();
    }
    return decoded.payload.sub; // userId
  } catch {
    throw new HttpError(401, "Failed to authenticate token");
  }
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyResourceOwnership(resourceUserId: string, authenticatedUserId: string) {
  if (resourceUserId !== authenticatedUserId) {
    throw new HttpError(403, "Forbidden");
  }
}

export async function hashPassword(password: string){
  try {
    const hashedPassword = await argon2.hash(password);
    return hashedPassword;
  } catch {
    throw new HttpError(500, "Failed to hash password");
  }
}

export async function checkHashedPassword(hashedPassword: string, plainPassword: string){
  try {
    const isMatch = await argon2.verify(hashedPassword, plainPassword);
    return isMatch;
  } catch {
    throw new HttpError(500, "Failed to check hashed password");
  }
}
