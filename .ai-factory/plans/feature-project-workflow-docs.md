# Implementation Plan: Документация проекта (dev workflow + admin workflow)

Branch: feature/project-workflow-docs
Created: 2026-07-17

## Settings
- Testing: no
- Logging: N/A (документация, нет исполняемого кода)
- Docs: no  # этот план сам является документацией, отдельный docs-чекпоинт не нужен

## Roadmap Linkage
Milestone: "Этап 5 — Полировка"
Rationale: Этап 5 явно указывает README как критерий завершения; этот план закрывает документационную часть этапа.

## Research Context
Source: .ai-factory/RESEARCH.md (Active Summary)

Goal: Разобраться в причине падения деплой-воркфлоу (решено отдельно); определить и написать доку "как работать с проектом" — dev workflow + workflow редактуры контента через админку.
Constraints: Admin/ реализован (Этап 2-3 завершены) — писать доку по факту, а не как TODO-заглушку.
Decisions: Готча на будущее — локальная разработка и админка коммитят в одну и ту же ветку main. Правило: git pull перед началом любой локальной сессии разработки, даже сразу после локального пуша.
Open questions: Нужен ли единый README или разделять на два документа? → Решено в этом плане: README как landing page + docs/ для деталей (dev-workflow.md, admin-workflow.md), по аналогии со схемой /aif-docs.
Next step (this plan): Написать docs/dev-workflow.md, docs/admin-workflow.md, README.md; обновить таблицу документации в AGENTS.md.

## Tasks

### Phase 1: Workflow docs
- [x] Task 1: Write docs/dev-workflow.md — local dev + deploy workflow, включая git-pull gotcha
- [x] Task 2: Write docs/admin-workflow.md — content editing via admin panel, sha-conflict/401 handling

### Phase 2: Landing page + AI context sync
- [x] Task 3: Create root README.md — project landing page (depends on 1, 2)
- [x] Task 4: Update AGENTS.md docs table to reflect created README and docs pages (depends on 1, 2, 3)

Single commit at the end (4 tasks, below the 5-task commit-checkpoint threshold).
