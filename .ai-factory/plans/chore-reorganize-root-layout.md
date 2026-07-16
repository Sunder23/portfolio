# Реорганизация корня репозитория: app/ vs dev-инструменты

**Ветка:** `chore/reorganize-root-layout`
**Создан:** 2026-07-16

## Проблема

Корень репозитория смешивает файлы приложения (`src/`, `public/`, `data/`,
`index.html`, `package.json`, `vite.config.ts`, `tsconfig*.json`,
`components.json`) с dev/AI-tooling файлами (`.ai-factory/`,
`.ai-factory.json`, `.claude/`, `.github/`, `.mcp.json`, `AGENTS.md`,
`PLAN.md`, `skills-lock.json`, `.oxlintrc.json`). Это визуальный шум при
просмотре корня и нечёткая граница «что относится к продукту» vs «что
относится к процессу разработки».

## Решение

Всё, что составляет собираемое приложение, переезжает в `app/`. Всё, что
является AI-factory/dev-tooling — включая `.oxlintrc.json`, привязанный к
package.json — либо остаётся физически в корне (когда инструмент требует
это по конвенции), либо переезжает вместе с app/, если требуется тем же
инструментом (например, `.oxlintrc.json` едет с `package.json`, т.к. `npm
run lint` резолвит конфиг относительно cwd).

**Жёсткие ограничения (не трогаем, требования самих инструментов):**

- `.git/` — репозиторий git
- `.github/` — GitHub Actions ищет workflow только в `<repo-root>/.github/workflows/`
- `.claude/` — Claude Code ищет skills/agents относительно cwd проекта
- `.mcp.json` — Claude Code читает MCP-конфиг из корня проекта
- `.ai-factory/`, `.ai-factory.json`, `skills-lock.json` — AI Factory/skills.sh CLI управляют этими файлами относительно корня репозитория; перенос рискует сломать `/aif-*` команды и не даёт ощутимого выигрыша в чистоте (это и так «дев»-файлы)
- `.gitignore` — конвенционально в корне (хотя git поддерживает вложенные, здесь нет причин уходить от конвенции)

**Переезжает в `app/`:**

```
app/
├── data/
├── public/
├── src/
├── index.html
├── package.json
├── package-lock.json
├── components.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── .oxlintrc.json
```

**Остаётся в корне (dev/AI-tooling + git/CI требования):**

```
/
├── .ai-factory/
├── .ai-factory.json
├── .claude/
├── .git/
├── .github/
├── .gitignore
├── .mcp.json
├── AGENTS.md
├── PLAN.md
├── skills-lock.json
└── app/
```

## Settings

- **Testing:** нет — задача чисто структурная, тестового фреймворка в проекте нет
- **Logging:** verbose — команды и их exit-код логировать в ходе сессии для трассируемости
- **Docs:** да, обязательный чекпоинт — AGENTS.md/DESCRIPTION.md/ARCHITECTURE.md/PLAN.md должны быть обновлены в рамках этого же плана, не пост-фактум

## Roadmap Linkage

Milestone: "none"
Rationale: реорганизация файловой структуры не соответствует ни одному из этапов 0–5 в ROADMAP.md — это техническая уборка, а не функциональный этап.

## Технические заметки

- `vite.config.ts` использует `path.resolve(__dirname, './src')` для алиаса `@/*` — после переезда `__dirname` автоматически становится `app/`, алиас продолжает резолвиться в `app/src` без изменений кода.
- `tsconfig.app.json`/`tsconfig.node.json` содержат только относительные пути (`./src`, `./node_modules/.tmp/...`) — корректны после переезда без правок.
- `lib/data.ts` использует `../../data/projects.json` из `src/lib/` — поскольку `src/` и `data/` переезжают вместе с сохранением относительной глубины, импорт остаётся рабочим без изменений.
- `.gitignore` паттерны `node_modules`, `dist`, `dist-ssr`, `*.local` не имеют ведущего `/`, поэтому матчатся на любой глубине — `app/node_modules` и `app/dist` продолжат игнорироваться без правок (проверить, не менять, если всё ок).
- `node_modules/` в корне не отслеживается git — просто удаляется и переустанавливается внутри `app/` через `npm install`.
- GitHub Actions workflow должен получить `working-directory: app` для шагов `npm ci`/`npm run build`, `cache-dependency-path: app/package-lock.json` для `setup-node`, и `path: app/dist` для `upload-pages-artifact`.

## Tasks

### Фаза 1 — Перенос файлов приложения

- [x] 1. **Move source and static assets into app/**
   `git mv src public data index.html app/` (создать `app/` неявно через git mv). Проверить `git status` — все перемещения должны быть отслежены как rename (R), не delete+add.

- [x] 2. **Move build/tooling config files into app/** *(blocked by 1)*
   `git mv package.json package-lock.json components.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json .oxlintrc.json app/`. Только перенос, без правок содержимого.

- [x] 3. **Regenerate node_modules inside app/ and verify local build** *(blocked by 2)*
   Удалить корневой `node_modules/` (gitignored, безопасно). `npm install` внутри `app/`. Прогнать `npm run dev` (запустить и остановить), `npm run build`, `npm run lint` из `app/` — все должны отработать без ошибок резолва путей. Логировать команды и exit-код.

### Фаза 2 — Обновление CI и проверка .gitignore

- [x] 4. **Update GitHub Actions deploy workflow for app/ layout** *(blocked by 3)*
   В `.github/workflows/deploy.yml` (остаётся в корне): добавить `working-directory: app` для шагов `npm ci`/`npm run build`, `cache-dependency-path: app/package-lock.json` в `setup-node`, изменить `path: dist` → `path: app/dist` в `upload-pages-artifact`. Job `deploy` не трогать.

- [x] 5. **Verify .gitignore still covers app/-nested build artifacts** *(blocked by 3)*
   После `npm install`/`npm run build` в `app/` проверить `git status` — `app/node_modules` и `app/dist` не должны появляться как untracked. Править `.gitignore` только если найден пробел.

### Фаза 3 — Обновление документации (обязательный чекпоинт)

- [x] 6. **Update AGENTS.md to reflect app/ root layout** *(blocked by 1, 2)*
   Обновить дерево «Структура проекта» и таблицу «Ключевые точки входа» — добавить префикс `app/` для `data/`, `public/`, `src/`, `index.html`, `package.json` и т.д. `.ai-factory/`, `.claude/`, `.github/`, `PLAN.md` остаются документированы как корневые.

- [x] 7. **Update .ai-factory/DESCRIPTION.md repo structure section** *(blocked by 1, 2)*
   Раздел «Структура репозитория» — добавить префикс `app/` в дерево. `.github/workflows/deploy.yml` остаётся в корне в дереве.

- [x] 8. **Update .ai-factory/ARCHITECTURE.md folder structure section** *(blocked by 1, 2)*
   Раздел «Структура папок» — уточнить, что `src/`-дерево теперь `app/src/`, и что `data/*.json`/`public/uploads/` лежат в `app/` (не в истинном корне репо). Примеры кода (`../../data/projects.json`) не менять — глубина не изменилась, только явно отметить это в тексте.

- [x] 9. **Update PLAN.md repo structure section** *(blocked by 1, 2)*
   Раздел «Структура репозитория» — добавить префикс `app/` для `data/`, `public/`, `src/`, `package.json`, `vite.config.ts`, `tsconfig*`, `index.html`, `components.json`. `.github/workflows/deploy.yml` и сам `PLAN.md` остаются в корне.

### Фаза 4 — Финальная проверка

- [x] 10. **Final verification pass and commit** *(blocked by 4, 5, 6, 7, 8, 9)*
    `git status` — чистый diff из renames + правки документации. Повторно прогнать `npm run build` и `npm run lint` из `app/`. Проверить, что корень репозитория теперь содержит только: `.git`, `.github`, `.claude`, `.ai-factory`, `.ai-factory.json`, `.mcp.json`, `.gitignore`, `AGENTS.md`, `PLAN.md`, `skills-lock.json`, `app/` — и **не** содержит `.oxlintrc.json`, `package.json`, `vite.config.ts`, `tsconfig*.json`, `components.json`, `src/`, `public/`, `data/`, `index.html`, `node_modules/` на верхнем уровне.

## Commit Plan

- **Commit 1** (после задач 1–3): `chore: move app source and build config into app/`
- **Commit 2** (после задач 4–5): `ci: update deploy workflow for app/ layout`
- **Commit 3** (после задач 6–9): `docs: update repo structure references for app/ layout`
- (Задача 10 — только проверка, отдельного коммита не требует)
