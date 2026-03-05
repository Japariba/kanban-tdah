// Relatorio de Dopamina Semanal - roda no cron.
// Agrega por usuario: minutos de foco, tarefa mais longa e precisao de estimativa.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_TIME_ZONE = "America/Sao_Paulo";
const APP_UTC_OFFSET = "-03:00";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type FocusSessionRow = {
  user_id: string;
  task_id: string;
  duration_minutes: number;
};

type CompletedTaskRow = {
  id: string;
  user_id: string;
  title: string;
  completed_at: string;
  estimated_time_minutes: number | null;
};

function addDays(ymd: string, days: number): string {
  const base = new Date(`${ymd}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function getDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not format date in configured time zone.");
  }

  return `${year}-${month}-${day}`;
}

function getLastWeekBounds(): { start: string; end: string; weekStartDate: string } {
  const todayYmd = getDateKeyInTimeZone(new Date(), APP_TIME_ZONE);
  const weekday = new Date(`${todayYmd}T00:00:00Z`).getUTCDay(); // 0=domingo
  const lastSundayYmd = addDays(todayYmd, -weekday);
  const lastMondayYmd = addDays(lastSundayYmd, -6);
  const endExclusiveYmd = addDays(lastSundayYmd, 1);
  const start = `${lastMondayYmd}T00:00:00${APP_UTC_OFFSET}`;
  const end = `${endExclusiveYmd}T00:00:00${APP_UTC_OFFSET}`;
  return { start, end, weekStartDate: lastMondayYmd };
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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const cronSecret = Deno.env.get("WEEKLY_REPORT_CRON_SECRET");
    if (!cronSecret) {
      throw new Error("Missing WEEKLY_REPORT_CRON_SECRET.");
    }

    const providedSecret = req.headers.get("x-cron-secret");
    if (providedSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { start, end, weekStartDate } = getLastWeekBounds();

    const { data: activeSessions } = await supabase
      .from("focus_sessions")
      .select("user_id, task_id, duration_minutes")
      .gte("created_at", start)
      .lt("created_at", end);

    const sessions = (activeSessions ?? []) as FocusSessionRow[];
    const userIds = [...new Set(sessions.map((s) => s.user_id))];

    const { data: completedTasksData } = await supabase
      .from("tasks")
      .select("id, user_id, title, completed_at, estimated_time_minutes")
      .not("completed_at", "is", null)
      .gte("completed_at", start)
      .lt("completed_at", end);

    const completedTasks = (completedTasksData ?? []) as CompletedTaskRow[];
    const completedByUser = completedTasks.reduce<Record<string, CompletedTaskRow[]>>((acc, task) => {
      if (!acc[task.user_id]) acc[task.user_id] = [];
      acc[task.user_id].push(task);
      return acc;
    }, {});

    for (const task of completedTasks) {
      if (task.user_id && !userIds.includes(task.user_id)) {
        userIds.push(task.user_id);
      }
    }

    for (const userId of userIds) {
      const userSessions = sessions.filter((s) => s.user_id === userId);
      const totalFocusMinutes = userSessions.reduce((sum, row) => sum + row.duration_minutes, 0);

      const byTask = userSessions.reduce<Record<string, number>>((acc, row) => {
        acc[row.task_id] = (acc[row.task_id] ?? 0) + row.duration_minutes;
        return acc;
      }, {});

      const tasksInWeek = completedByUser[userId] ?? [];

      let longestTaskTitle: string | null = null;
      let longestTaskMinutes: number | null = null;
      for (const task of tasksInWeek) {
        const minutes = byTask[task.id] ?? 0;
        if (minutes > 0 && (longestTaskMinutes == null || minutes > longestTaskMinutes)) {
          longestTaskMinutes = minutes;
          longestTaskTitle = task.title;
        }
      }

      let estimationPrecisionPercent: number | null = null;
      const withEstimate = tasksInWeek.filter(
        (task) => task.estimated_time_minutes != null && (byTask[task.id] ?? 0) > 0,
      );
      if (withEstimate.length > 0) {
        const scores = withEstimate.map((task) =>
          precisionScore(task.estimated_time_minutes as number, byTask[task.id] ?? 0),
        );
        estimationPrecisionPercent = Math.round(
          scores.reduce((acc, score) => acc + score, 0) / scores.length,
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
        { onConflict: "user_id,week_start_date" },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        week_start_date: weekStartDate,
        users_processed: userIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
