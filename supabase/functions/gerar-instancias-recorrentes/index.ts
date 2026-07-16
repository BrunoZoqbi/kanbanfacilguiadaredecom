import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Cálculo de próximas datas (sem dependência de bibliotecas externas)
// ---------------------------------------------------------------------------

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // recua até domingo (0)
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

function applyTime(date: Date, timeStr: string | null, fallback: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    result.setHours(h, m, 0, 0);
  } else {
    result.setHours(fallback.getHours(), fallback.getMinutes(), 0, 0);
  }
  return result;
}

function computeInstanceDates(
  baseDate: Date,
  recurrenceType: string,
  interval: number,
  days: number[],
  endDate: Date | null,
  maxCount: number,
): Date[] {
  const result: Date[] = [];

  if (recurrenceType === "daily") {
    let k = 1;
    while (result.length < maxCount) {
      const d = addDays(baseDate, k * interval);
      if (endDate && d > endDate) break;
      result.push(d);
      k++;
    }
  } else if (recurrenceType === "weekly") {
    const sortedDays = [...days].sort((a, b) => a - b);
    if (sortedDays.length === 0) return result;

    const weekStart = startOfWeek(baseDate);
    let cycleIndex = 0;

    outer: for (;;) {
      const currentWeekStart = addWeeks(weekStart, cycleIndex * interval);
      for (const dow of sortedDays) {
        const candidate = addDays(currentWeekStart, dow);
        if (candidate <= baseDate) continue;
        if (endDate && candidate > endDate) break outer;
        result.push(candidate);
        if (result.length >= maxCount) break outer;
      }
      cycleIndex++;
      if (cycleIndex > 104) break; // safety: 2 years
    }
  } else if (recurrenceType === "monthly") {
    let k = 1;
    while (result.length < maxCount) {
      const d = addMonths(baseDate, k * interval);
      if (endDate && d > endDate) break;
      result.push(d);
      k++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Autentica o chamador
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError(401, "Unauthorized");

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !user) return jsonError(401, "Unauthorized");

    // Valida papel (admin, gestor_tecnico ou gestor_comercial)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = roleRow?.role ?? "user";
    if (!["admin", "gestor_tecnico", "gestor_comercial"].includes(role)) {
      return jsonError(403, "Sem permissão para gerar instâncias recorrentes");
    }

    const body = await req.json();
    const taskId: string = body.task_id;
    const count: number = Math.min(body.count ?? 4, 20); // máx 20 instâncias por chamada

    if (!taskId) return jsonError(400, "task_id é obrigatório");

    // Busca o template
    const { data: template, error: templateErr } = await adminClient
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (templateErr || !template) return jsonError(404, "Template não encontrado");
    if (template.recurrence_type === "none") {
      return jsonError(400, "Esta tarefa não é um template de recorrência");
    }
    if (template.parent_task_id) {
      return jsonError(400, "Esta tarefa é uma instância, não um template");
    }

    // Busca a instância mais recente para saber de onde continuar
    const { data: latestInstance } = await adminClient
      .from("tasks")
      .select("due_date")
      .eq("parent_task_id", taskId)
      .order("due_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startFrom = latestInstance
      ? new Date(latestInstance.due_date)
      : new Date(template.due_date);

    const endDate = template.recurrence_end_date
      ? new Date(template.recurrence_end_date)
      : null;

    // Quantas instâncias já existem (para respeitar recurrence_end_after)
    let effectiveMax = count;
    if (template.recurrence_end_after) {
      const { count: existingCount } = await adminClient
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("parent_task_id", taskId);
      const remaining = template.recurrence_end_after - (existingCount ?? 0);
      effectiveMax = Math.min(count, Math.max(0, remaining));
    }

    if (effectiveMax <= 0) {
      return new Response(
        JSON.stringify({ created: 0, instances: [], message: "Limite de ocorrências atingido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dates = computeInstanceDates(
      startFrom,
      template.recurrence_type,
      template.recurrence_interval ?? 1,
      template.recurrence_days ?? [],
      endDate,
      effectiveMax,
    );

    if (dates.length === 0) {
      return new Response(
        JSON.stringify({ created: 0, instances: [], message: "Nenhuma data futura disponível" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const baseDateForTime = new Date(template.due_date);
    const instances = dates.map((d) => ({
      title: template.title,
      description: template.description,
      assignee_id: template.assignee_id,
      created_by_id: template.created_by_id,
      task_type: template.task_type,
      priority: template.priority,
      location: template.location,
      due_date: applyTime(d, template.recurrence_time ?? null, baseDateForTime).toISOString(),
      parent_task_id: taskId,
      recurrence_type: "none",
      recurrence_interval: 1,
    }));

    const { data: created, error: insertErr } = await adminClient
      .from("tasks")
      .insert(instances)
      .select("id, due_date");

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ created: created?.length ?? 0, instances: created }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
