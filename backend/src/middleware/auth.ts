import { Request, Response, NextFunction } from "express";
import { getSupabase } from "../config/supabase.js";
import { Role } from "../types/index.js";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }
  const token = header.slice(7);

  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ success: false, message: "Invalid or expired token." });
      return;
    }

    const { data: profile, error: profileError } = await getSupabase()
      .from("profiles")
      .select("id, email, role, full_name, is_active")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ success: false, message: "Profile not found." });
      return;
    }
    if (!profile.is_active) {
      res.status(403).json({ success: false, message: "Account is deactivated." });
      return;
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role as Role,
      full_name: profile.full_name,
    };
    next();
  } catch {
    res.status(500).json({ success: false, message: "Authentication failed." });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Insufficient permissions." });
      return;
    }
    next();
  };
}