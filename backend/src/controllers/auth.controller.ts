import { Request, Response } from "express";
import { getSupabase } from "../config/supabase.js";
import { logAudit } from "../services/audit.service.js";
import { ApiError } from "../middleware/error.js";

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, fullName, nativeLanguage, experienceLevel } = req.body;

  const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,   // skip confirmation email — admin API bypasses rate limits
  });

  if (authError) {
    console.error("[auth:register] Supabase admin.createUser error:", JSON.stringify(authError));
    // Provide a friendlier message for duplicate emails
    const msg = authError.message.toLowerCase().includes("already")
      ? "An account with this email already exists. Please sign in instead."
      : authError.message;
    throw new ApiError(400, msg);
  }
  if (!authData.user) {
    throw new ApiError(400, "User could not be created.");
  }

  const { error: profileError } = await getSupabase().from("profiles").insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    role: "contributor",
    native_language: nativeLanguage,
    experience_level: experienceLevel,
    is_active: true,
  });

  if (profileError) {
    console.error("[auth:register] profile insert failed", profileError);
    throw new ApiError(500, "Account created but profile setup failed. Please contact an admin.");
  }

  await logAudit({
    userId: authData.user.id,
    action: "auth.register",
    entityType: "profile",
    entityId: authData.user.id,
    metadata: { email },
  });

  res.status(201).json({
    success: true,
    message: "Registered successfully. You can now sign in.",
    data: { id: authData.user.id },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) {
    throw new ApiError(401, error.message);
  }

  const { data: profile } = await getSupabase()
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("id", data.user.id)
    .single();

  await logAudit({
    userId: data.user.id,
    action: "auth.login",
    entityType: "profile",
    entityId: data.user.id,
  });

  res.json({
    success: true,
    data: {
      token: data.session.access_token,
      user: profile,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const id = req.user?.id ?? null;
  if (id) {
    await logAudit({ userId: id, action: "auth.logout", entityType: "profile", entityId: id });
    await getSupabase().auth.signOut();
  }
  res.json({ success: true, message: "Logged out." });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: req.user });
}