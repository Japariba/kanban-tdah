// Relatório de Dopamina Semanal — roda todo domingo à noite (cron)
// Agrega: total de minutos de hiperfoco, tarefa mais longa concluída, precisão de estimativa

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getLastWeekBounds(): { start: string; end: string; weekStartDate: string } {
  const now = new Date();
  // Último domingo à meia-noite (fim da semana que estamos agregando)
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - now.getDay());
  lastSunday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastMonday.getDate() - 6);
  const start = lastMonday.toISOString().slice(0, 19).replace("T", " ");
  const end = new Date(lastSunday);
  end.setDate(end.getDate() + 1);
  const endExclusive = end.toISOString().slice(0, 19).replace("T", " ");
  const weekStartDate = lastMonday.toISOString().slice(0, 10);
  return { start, end: endExclusive, weekStartDate };
}

function precisionScore(estimated: number, actual: number): number {
  const max = Math.max(estimated, actual, 1);
  const error = Math.abs(actual - estimated) / max;
  return Math.round(100 * (1 - Math.min(error, 1)));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { start, end, weekStartDate } = getLastWeekBounds();

    // Usuários que tiveram atividade na semana (foco ou tarefa concluída)
    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("user_id")
      .gte("created_at", start)
      .lt("created_at", end);
    const userIds = [...new Set((sessions || []).map((s) => s.user_id))];

    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("id, user_id, title, completed_at, estimated_time_minutes")
      .not("completed_at", "is", null)
      .gte("completed_at", start)
      .lt("completed_at", end);
    const completedByUser = (completedTasks || []).reduce<Record<string, typeof completedTasks>>((acc, t) => {
      if (!acc[t.user_id]) acc[t.user_id] = [];
      acc[t.user_id].push(t);
      return acc;
    }, {});

    // Incluir usuários que só concluíram tarefas (sem sessões na semana)
    for (const t of completedTasks || []) {
      if (t.user_id && !userIds.includes(t.user_id)) userIds.push(t.user_id);
    }

    for (const userId of userIds) {
      const { data: userSessions } = await supabase
        .from("focus_sessions")
        .select("task_id, duration_minutes")
        .eq("user_id", userId)
        .gte("created_at", start)
        .lt("created_at", end);

      const totalFocusMinutes = (userSessions || []).reduce((s, r) => s + r.duration_minutes, 0);

      const tasksInWeek = completedByUser[userId] || [];
      const byTask = (userSessions || []).reduce<Record<string, number>>((acc, r) => {
        acc[r.task_id] = (acc[r.task_id] || 0) + r.duration_minutes;
        return acc;
      });

      let longestTaskTitle: string | null = null;
      let longestTaskMinutes: number | null = null;
      for (const task of tasksInWeek) {
        const mins = byTask[task.id] || 0;
        if (mins > 0 && (longestTaskMinutes == null || mins > longestTaskMinutes)) {
          longestTaskMinutes = mins;
          longestTaskTitle = task.title;
        }
      }

      let estimationPrecisionPercent: number | null = null;
      const withEstimate = tasksInWeek.filter(
        (t) => t.estimated_time_minutes != null && (byTask[t.id] ?? 0) > 0
      );
      if (withEstimate.length > 0) {
        const scores = withEstimate.map((t) =>
          precisionScore(t.estimated_time_minutes!, byTask[t.id] ?? 0)
        );
        estimationPrecisionPercent = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        );
      }

      await supabase.from("weekly_reports").upsert(
        {
          user_id: userId,
          week_start_date: weekStartDate,
          total_focus_minutes: totalFocusMinutes,
          longest_task_title: longestTaskTitle,
          longest_task_minutes: longestTaskMinutes,
          estimation_precision_percent: estimationPrecisionPercent,
        },
        { onConflict: "user_id,week_start_date" }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        week_start_date: weekStartDate,
        users_processed: userIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
