import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIMITE_TENTATIVAS = 5;
const JANELA_MINUTOS = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
    const { numero_ticket, documento } = await req.json();

    if (!numero_ticket || !documento) {
      return new Response(
        JSON.stringify({ error: "Informe o número do ticket e o CPF/telefone cadastrado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Anti força-bruta: verifica tentativas recentes por número de ticket E por IP
    const desde = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000).toISOString();

    const { count: tentativasTicket } = await supabaseAdmin
      .from("ticket_consulta_tentativas")
      .select("*", { count: "exact", head: true })
      .eq("numero_ticket", numero_ticket)
      .eq("sucesso", false)
      .gte("created_at", desde);

    const { count: tentativasIp } = await supabaseAdmin
      .from("ticket_consulta_tentativas")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("sucesso", false)
      .gte("created_at", desde);

    if ((tentativasTicket ?? 0) >= LIMITE_TENTATIVAS || (tentativasIp ?? 0) >= LIMITE_TENTATIVAS) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .select("id, numero_ticket, nome_cliente, tipo_problema, descricao, status, prioridade, created_at, resolved_at, cpf_ou_contrato, telefone")
      .eq("numero_ticket", numero_ticket)
      .single();

    if (ticketError || !ticket) {
      await supabaseAdmin.from("ticket_consulta_tentativas").insert({ numero_ticket, ip, sucesso: false });
      return new Response(
        JSON.stringify({ error: "Ticket não encontrado. Verifique o número informado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const documentoLimpo = String(documento).replace(/\D/g, "");
    const cpfCadastrado = String(ticket.cpf_ou_contrato || "").replace(/\D/g, "");
    const telefoneCadastrado = String(ticket.telefone || "").replace(/\D/g, "");

    if (documentoLimpo !== cpfCadastrado && documentoLimpo !== telefoneCadastrado) {
      await supabaseAdmin.from("ticket_consulta_tentativas").insert({ numero_ticket, ip, sucesso: false });
      return new Response(
        JSON.stringify({ error: "Dados não conferem. Verifique o CPF ou telefone informado." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabaseAdmin.from("ticket_consulta_tentativas").insert({ numero_ticket, ip, sucesso: true });

    const { data: respostasRaw } = await supabaseAdmin
      .from("ticket_respostas")
      .select("texto, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    // Minimização de dados: nunca expor nome individual do atendente ao cliente
    const respostas = (respostasRaw || []).map((r) => ({
      autor_nome: "Equipe Fibron",
      texto: r.texto,
      created_at: r.created_at,
    }));

    const { id: _id, cpf_ou_contrato: _cpf, telefone: _tel, ...ticketPublico } = ticket;

    return new Response(
      JSON.stringify({ success: true, ticket: ticketPublico, respostas }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
