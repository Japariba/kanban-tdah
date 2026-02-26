# Relatório de Dopamina Semanal

Esta Edge Function agrega, por usuário, para a semana que terminou no último domingo:

- **Total de minutos de hiperfoco** (soma de `focus_sessions.duration_minutes`)
- **Tarefa mais longa concluída** (tarefa com mais minutos de foco na semana)
- **Precisão de estimativa** (média da precisão estimado vs real nas tarefas da semana)

## Como agendar (todo domingo à noite)

1. **Supabase Dashboard** → Edge Functions → `weekly-dopamina-report` → Settings → **Cron**  
   - Schedule: `0 3 * * 1` (segunda às 03:00 UTC = domingo ~23h BRT) ou o horário desejado.

2. **Ou** use um cron externo (GitHub Actions, Vercel Cron, etc.) chamando:
   ```http
   POST https://<project-ref>.supabase.co/functions/v1/weekly-dopamina-report
   Authorization: Bearer <anon-or-service-role-key>
   ```

3. **Ou** com `pg_cron` no Supabase (SQL):
   - Habilitar extensão `pg_net` e agendar uma requisição HTTP para a URL da função com o header `Authorization: Bearer <service_role_key>`.

Após rodar, os dados ficam em `weekly_reports` e podem ser lidos na página **Relatório Semanal** do app.
