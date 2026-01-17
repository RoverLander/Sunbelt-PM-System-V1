// ============================================================================
// Worker Authentication Edge Function
// ============================================================================
// Handles PIN-based authentication for factory floor workers (PWA)
// Workers are stored in the workers table, not Supabase Auth users table
//
// Endpoints:
//   POST /worker-auth/login    - Authenticate with employee_id + PIN
//   POST /worker-auth/logout   - Revoke session token
//   POST /worker-auth/verify   - Verify session token is valid
//   POST /worker-auth/set-pin  - Set/reset PIN (requires manager auth)
//
// Created: January 16, 2026
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET = Deno.env.get("JWT_SECRET") || Deno.env.get("SUPABASE_JWT_SECRET")!;

// Configuration
const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MINUTES = 15;
const SESSION_DURATION_HOURS = 8; // Shift length

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// JWT Utilities
// ============================================================================

async function createJWT(payload: Record<string, unknown>, expiresAt: Date): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
  };

  const encodedPayload = btoa(JSON.stringify(fullPayload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${encodedSignature}`;
}

async function verifyJWT(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode signature
    const signatureStr = encodedSignature
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const signature = Uint8Array.from(atob(signatureStr), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
    if (!valid) return null;

    // Decode payload
    const payloadStr = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadStr));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================================
// Login Handler
// ============================================================================

async function handleLogin(req: Request): Promise<Response> {
  const { employee_id, pin, factory_code, device_info } = await req.json();

  if (!employee_id || !pin) {
    return new Response(
      JSON.stringify({ error: "Employee ID and PIN are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Find worker by employee_id
  let query = supabase
    .from("workers")
    .select(`
      id,
      factory_id,
      employee_id,
      first_name,
      last_name,
      full_name,
      is_lead,
      is_active,
      primary_station_id,
      pin_hash,
      pin_attempts,
      pin_locked_until,
      factory:factories(id, name, code)
    `)
    .eq("employee_id", employee_id)
    .eq("is_active", true);

  // If factory_code provided, filter by factory
  if (factory_code) {
    const { data: factory } = await supabase
      .from("factories")
      .select("id")
      .eq("code", factory_code)
      .single();

    if (factory) {
      query = query.eq("factory_id", factory.id);
    }
  }

  const { data: worker, error: workerError } = await query.single();

  if (workerError || !worker) {
    return new Response(
      JSON.stringify({ error: "Invalid employee ID" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if account is locked
  if (worker.pin_locked_until && new Date(worker.pin_locked_until) > new Date()) {
    const unlockTime = new Date(worker.pin_locked_until);
    return new Response(
      JSON.stringify({
        error: "Account locked due to too many failed attempts",
        locked_until: unlockTime.toISOString(),
        minutes_remaining: Math.ceil((unlockTime.getTime() - Date.now()) / 60000)
      }),
      { status: 423, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if PIN is set
  if (!worker.pin_hash) {
    return new Response(
      JSON.stringify({ error: "PIN not set. Please contact your supervisor." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify PIN
  const pinValid = await bcrypt.compare(pin, worker.pin_hash);

  if (!pinValid) {
    // Increment failed attempts
    const newAttempts = (worker.pin_attempts || 0) + 1;
    const updates: Record<string, unknown> = { pin_attempts: newAttempts };

    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      updates.pin_locked_until = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
    }

    await supabase
      .from("workers")
      .update(updates)
      .eq("id", worker.id);

    const attemptsRemaining = MAX_PIN_ATTEMPTS - newAttempts;
    return new Response(
      JSON.stringify({
        error: "Invalid PIN",
        attempts_remaining: Math.max(0, attemptsRemaining),
        locked: attemptsRemaining <= 0
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // PIN valid - reset attempts and update last_login
  await supabase
    .from("workers")
    .update({
      pin_attempts: 0,
      pin_locked_until: null,
      last_login: new Date().toISOString()
    })
    .eq("id", worker.id);

  // Create session
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const tokenPayload = {
    worker_id: worker.id,
    factory_id: worker.factory_id,
    employee_id: worker.employee_id,
    is_lead: worker.is_lead,
    primary_station_id: worker.primary_station_id,
    type: "worker_session"
  };

  const token = await createJWT(tokenPayload, expiresAt);
  const tokenHash = await hashToken(token);

  // Store session
  const { error: sessionError } = await supabase
    .from("worker_sessions")
    .insert({
      worker_id: worker.id,
      factory_id: worker.factory_id,
      token_hash: tokenHash,
      device_info: device_info || {},
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
      login_source: "pwa"
    });

  if (sessionError) {
    console.error("Session creation error:", sessionError);
    return new Response(
      JSON.stringify({ error: "Failed to create session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get primary station info
  let primaryStation = null;
  if (worker.primary_station_id) {
    const { data: station } = await supabase
      .from("station_templates")
      .select("id, name, code, color")
      .eq("id", worker.primary_station_id)
      .single();
    primaryStation = station;
  }

  return new Response(
    JSON.stringify({
      token,
      expires_at: expiresAt.toISOString(),
      worker: {
        id: worker.id,
        employee_id: worker.employee_id,
        name: worker.full_name || `${worker.first_name} ${worker.last_name}`,
        is_lead: worker.is_lead,
        factory_id: worker.factory_id,
        factory: worker.factory,
        primary_station: primaryStation
      }
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============================================================================
// Logout Handler
// ============================================================================

async function handleLogout(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "No token provided" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.substring(7);
  const tokenHash = await hashToken(token);

  // Revoke session
  const { error } = await supabase
    .from("worker_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);

  if (error) {
    console.error("Logout error:", error);
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============================================================================
// Verify Handler
// ============================================================================

async function handleVerify(req: Request): Promise<Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ valid: false, error: "No token provided" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.substring(7);

  // Verify JWT signature and expiration
  const payload = await verifyJWT(token);
  if (!payload) {
    return new Response(
      JSON.stringify({ valid: false, error: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check session not revoked
  const tokenHash = await hashToken(token);
  const { data: session, error } = await supabase
    .from("worker_sessions")
    .select("id, revoked_at, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !session || session.revoked_at) {
    return new Response(
      JSON.stringify({ valid: false, error: "Session revoked or not found" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update last activity
  await supabase
    .from("worker_sessions")
    .update({ last_activity: new Date().toISOString() })
    .eq("id", session.id);

  return new Response(
    JSON.stringify({
      valid: true,
      worker_id: payload.worker_id,
      factory_id: payload.factory_id,
      is_lead: payload.is_lead,
      expires_at: new Date((payload.exp as number) * 1000).toISOString()
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============================================================================
// Set PIN Handler (Manager Only)
// ============================================================================

async function handleSetPin(req: Request): Promise<Response> {
  // This endpoint requires manager authentication via Supabase Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Manager authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.substring(7);

  // Verify this is a Supabase Auth token (manager), not a worker token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid manager credentials" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role, factory_id")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["VP", "Director", "Admin", "Plant_GM", "Production_Manager"];
  if (!userData || !allowedRoles.includes(userData.role)) {
    return new Response(
      JSON.stringify({ error: "Insufficient permissions. Manager role required." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { worker_id, new_pin } = await req.json();

  if (!worker_id || !new_pin) {
    return new Response(
      JSON.stringify({ error: "worker_id and new_pin are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate PIN format (4-6 digits)
  if (!/^\d{4,6}$/.test(new_pin)) {
    return new Response(
      JSON.stringify({ error: "PIN must be 4-6 digits" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get worker to verify factory access
  const { data: worker } = await supabase
    .from("workers")
    .select("id, factory_id, full_name")
    .eq("id", worker_id)
    .single();

  if (!worker) {
    return new Response(
      JSON.stringify({ error: "Worker not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify manager has access to worker's factory (unless VP/Director/Admin)
  if (!["VP", "Director", "Admin"].includes(userData.role) && userData.factory_id !== worker.factory_id) {
    return new Response(
      JSON.stringify({ error: "Cannot set PIN for worker in different factory" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Hash and store PIN
  const pinHash = await bcrypt.hash(new_pin);

  const { error: updateError } = await supabase
    .from("workers")
    .update({
      pin_hash: pinHash,
      pin_attempts: 0,
      pin_locked_until: null
    })
    .eq("id", worker_id);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: "Failed to set PIN" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Revoke all existing sessions for this worker
  await supabase
    .from("worker_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("worker_id", worker_id)
    .is("revoked_at", null);

  return new Response(
    JSON.stringify({
      success: true,
      message: `PIN set for ${worker.full_name}. All existing sessions have been revoked.`
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    switch (path) {
      case "login":
        return await handleLogin(req);
      case "logout":
        return await handleLogout(req);
      case "verify":
        return await handleVerify(req);
      case "set-pin":
        return await handleSetPin(req);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown endpoint", available: ["login", "logout", "verify", "set-pin"] }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Worker auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
