import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
export const COOKIE_NAME = "admin_token";

export function signAdminToken() {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "4h" });
}

export function verifyAdminToken(token: string | undefined) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { role: "admin" };
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  return !!verifyAdminToken(token);
}