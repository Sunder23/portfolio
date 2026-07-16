# Research

Updated: 2026-07-16 23:15
Status: active

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: Деплой на GitHub Pages (диагностика) + документация "как работать с проектом"
Goal: Разобраться в причине падения деплой-воркфлоу; определить, какую доку писать для рабочего процесса разработки + редактуры контента.
Constraints: Доку про workflow с админкой писать рано — admin/ ещё не реализован (Этап 2 по PLAN.md), Admin.tsx пока заглушка.
Decisions:
- Причина 404 в deploy-pages@v4 — Source в Settings → Pages не был выставлен на "GitHub Actions" (не связано с Node 20 deprecation warning, это отдельный неопасный шум runner'а). Исправлено вручную в UI, деплой прошёл успешно (build 20s → deploy 9s, https://sunder23.github.io/portfolio/).
- Целевой workflow пользователя: правки кода локально → npm run dev/build для локального теста → git push (main) → auto-deploy; отдельно, после того как admin/ будет реализован — правки контента через /#/admin (пишет прямо в main через GitHub Contents API).
- Готча на будущее: локальная разработка и админка коммитят в одну и ту же ветку main. Правило для будущей доки: git pull перед началом любой локальной сессии разработки, даже сразу после локального пуша — иначе следующий пуш может конфликтовать с тем, что накоммитила админка, или тихо затереть её изменения.
- Решение: документацию по работе с проектом (dev-онбординг + workflow редактуры контента через админку) откладываем до момента, когда admin/ (TokenGate, github.ts, editors/) будет реализован — писать по факту, а не как TODO-заглушку.
Open questions: Когда стартует Этап 2 (админка)? Нужен ли единый README (dev + контент) или разделять на два документа?
Success signals: После реализации admin/ — согласовать структуру доки (единый README вида /aif-docs, или README + docs/ странички) и зафиксировать правило git pull.
Next step: Когда admin/ будет готов (или начнётся его реализация) — вернуться к этой теме через /aif-explore или сразу /aif-plan для Этапа 2, и на этом шаге также написать документацию.
<!-- aif:active-summary:end -->

## Sessions
<!-- aif:sessions:start -->
### 2026-07-16 23:15 — Деплой на GitHub Pages: диагностика 404 + план доки на потом
What changed: Диагностирована и устранена причина падения deploy-pages@v4 (Source не был выставлен на GitHub Actions в Settings → Pages). Обсуждён и отложен вопрос документации workflow.
Key notes: Node 20 deprecation warning — красная селёдка, не связан с реальной причиной падения. Реальная ошибка — "Failed to create deployment (status 404) ... Ensure GitHub Pages has been enabled". После правки Source в UI деплой прошёл успешно.
Links (paths): .github/workflows/deploy.yml, AGENTS.md (уже отмечал README.md как TODO), PLAN.md (Этап 2 — админка)
<!-- aif:sessions:end -->
