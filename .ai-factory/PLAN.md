# Implementation Plan: Этап 0 — Каркас проекта

Branch: none
Created: 2026-07-16

## Settings
- Testing: no
- Logging: verbose
- Docs: no

## Roadmap Linkage
Milestone: "Этап 0 — Каркас"
Rationale: Первый майлстоун ROADMAP.md — этот план реализует его целиком: Vite + React + TS, роутер, workflow деплоя, валидные пустые JSON.

## Commit Plan
- **Commit 1** (после задач 1-3): "chore: scaffold Vite + React + TS, Tailwind/shadcn, HashRouter"
- **Commit 2** (после задач 4-6): "feat: i18n uk/ru/en, data schema, lib/data.ts"
- **Commit 3** (после задачи 7): "ci: deploy to GitHub Pages via GitHub Actions"

## Tasks

### Phase 1: Каркас и UI-база
- [x] Task 1: Инициализировать Vite + React 19 + TS проект
- [x] Task 2: Настроить Tailwind CSS + базовую инициализацию shadcn/ui (depends on 1)
- [x] Task 3: Настроить React Router (HashRouter) и страницы-заглушки (depends on 1)
<!-- Commit checkpoint: tasks 1-3 -->

### Phase 2: Данные и локализация
- [ ] Task 4: Настроить react-i18next с пустыми словарями uk/ru/en (depends on 3)
- [ ] Task 5: Создать схему данных и валидные пустые data/*.json (depends on 1)
- [ ] Task 6: Реализовать lib/data.ts как единственную точку чтения JSON (depends on 5, 4)
<!-- Commit checkpoint: tasks 4-6 -->

### Phase 3: Деплой
- [ ] Task 7: Настроить деплой на GitHub Pages через GitHub Actions (depends on 1)
<!-- Commit checkpoint: task 7 -->

## Критерий готовности этапа

Пустой сайт открывается на GitHub Pages: маршруты `#/uk/`, `#/ru/`, `#/en/` рендерят страницы-заглушки Home/Projects/ProjectDetail/About, данные читаются из `data/*.json` через `lib/data.ts`, деплой проходит автоматически через GitHub Actions при пуше в `main`.
