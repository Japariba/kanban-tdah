# Relatorio de Dopamina Semanal

Esta Edge Function agrega, por usuario, para a semana encerrada no domingo:

- Total de minutos de foco (`focus_sessions.duration_minutes`)
- Tarefa mais longa concluida na semana
- Precisao de estimativa (estimado vs real)

## Seguranca obrigatoria

Configure o segredo `WEEKLY_REPORT_CRON_SECRET` na function e envie o header:

`x-cron-secret: <WEEKLY_REPORT_CRON_SECRET>`

Sem esse header, a function responde `401`.

## Agendamento

1. Supabase Dashboard -> Edge Functions -> `weekly-dopamina-report` -> Settings -> Cron
2. Exemplo de schedule: `0 3 * * 1` (segunda 03:00 UTC, domingo a noite no Brasil)

## Chamada manual

```http
POST https://<project-ref>.supabase.co/functions/v1/weekly-dopamina-report
x-cron-secret: <WEEKLY_REPORT_CRON_SECRET>
Authorization: Bearer <anon-or-service-role-key>
```
