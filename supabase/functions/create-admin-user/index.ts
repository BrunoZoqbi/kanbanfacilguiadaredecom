import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, fullName, isAdmin, isGestorTecnico, isGestorComercial } = await req.json();

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email, password and fullName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roleFlagsCount = [isAdmin, isGestorTecnico, isGestorComercial].filter(Boolean).length;
    if (roleFlagsCount > 1) {
      return new Response(
        JSON.stringify({ error: "Usuário só pode ter um papel: Administrador, Gestor Técnico ou Gestor Comercial" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // Update profile with full_name (trigger should have created it)
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    // Set the role if requested (admin, gestor_tecnico and gestor_comercial
    // are mutually exclusive, and user_roles only enforces
    // UNIQUE(user_id, role) — not one row per user — so we clear any
    // existing rows before inserting).
    if (isAdmin || isGestorTecnico || isGestorComercial) {
      const role = isAdmin ? "admin" : isGestorTecnico ? "gestor_tecnico" : "gestor_comercial";

      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          fullName,
          isAdmin: !!isAdmin,
          isGestorTecnico: !!isGestorTecnico,
          isGestorComercial: !!isGestorComercial,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
