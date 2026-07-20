# Implementation Plan: Реорганизация структуры src/ ("Вариант B" — точечные фиксы поверх Modular Monolith)

Branch: feature/reorganize-src-structure
Created: 2026-07-20

## Settings
- Testing: только перенос существующих colocated-тестов вместе с компонентами (без потери поведения); новых тестов для Home-секций не пишем — их сейчас тоже нет.
- Logging: verbose во время реализации — на каждый перенесённый/извлечённый компонент временный `console.debug('[refactor:<scope>] ...')`, чтобы сразу ловить сломанные импорты/пропсы. Все временные логи снимаются отдельной задачей (Task 13) перед завершением. Существующий `console.debug('[Home] sections loaded', ...)` в Home/index.tsx — не часть этого рефакторинга, не трогать.
- Docs: yes — обязательный чек-пойнт документации в конце (ARCHITECTURE.md + DESCRIPTION.md — обе уже описывают структуру папок, которая меняется: `pages/Home/*`, `admin/context/`, колокейт-переезды).

## Roadmap Linkage
Milestone: "none"
Rationale: Пропущено по решению пользователя — это внутренний структурный рефакторинг, а не отдельный продуктовый этап (все открытые этапы roadmap, кроме Этапа 4 — Лиды, не связаны с этой задачей).

## Research Context

Источник: `.ai-factory/RESEARCH.md`, Active Summary от 2026-07-20.

Topic: Реорганизация структуры `src/` без перехода на FSD — устранить конкретные раздражители (простыня `Home/index.tsx`, раздутые `components/`/`admin/components/`, контексты вперемешку с обычными компонентами) без миграции на Feature-Sliced Design.

Ключевые решения:
- FSD отклонён целиком — избыточен для соло-проекта без бэкенда, близкого к завершению по ROADMAP.
- `lib/data.ts` / `admin/lib/github.ts` (единые точки чтения/записи) и `types.ts` уже в порядке — не трогаем.
- **Правило колокейта:** 1 потребитель → компонент переезжает к этому потребителю; 2+ потребителя (реально shared) → остаётся в `components/`. Строго, кроме двух зафиксированных исключений: `Nav/Footer/Scanline` (части одного layout-root `PublicLayout`, не вкладываются) и `hooks/useLocale.ts` (10 строк, слишком тривиален для отдельной папки `context/`).
- **Новое правило для контекстов:** любой файл с `createContext` живёт в своей папке `context/`/`admin/context/` независимо от числа потребителей.
- Для детей `AdminLayout` (AdminSidebar, TokenGate, SaveAllButton) осознанно решено НЕ делать симметричное исключение (в отличие от Nav/Footer/Scanline) — колокейт строгий.
- `AdminDraftContext` не переименовывается в `AdminDraftStore`, хотя по факту это стор — сохраняем консистentность с Context API-механизмом.

Success signals: Home/index.tsx разбит на секции без потери поведения; `components/`/`admin/components/` содержат только реально переиспользуемые компоненты + два исключения; все `createContext`-файлы (кроме `useLocale.ts`) — в `context/`; все существующие colocated-тесты продолжают проходить (меняются только импорты/пути).

## Верификация структуры (перепроверено перед планированием)

Разведка подтвердила состояние кода на момент планирования (расхождений с RESEARCH.md не найдено):

- `pages/Home/index.tsx` — 313 строк, 12 последовательных секций рендера (см. таблицу в Task 2-6 ниже), без извлечённых хелпер-функций — все вычисления инлайн в теле компонента.
- `components/`: 11 папок + `ui/`. Реальные consumer-counts: `TerminalCursor` (1 — Home), `CommitActivityGrid` (1 — Home), `ProjectFilters` (1 — Projects), `ThemeToggle` (1 — Nav), `CommandLabel` (5), `MarkdownContent` (2), `ProjectCard` (3), `LocaleSwitcher` (2), `Nav`/`Footer`/`Scanline` (по 1, но исключение — части PublicLayout).
- `admin/components/`: 12 папок. `createContext` найден только в `AdminAuthContext`, `AdminDraftContext`, `AdminLocaleContext`. Остальные 9 — обычные компоненты. Single-consumer среди них: `RichTextEditor` (LocalizedField), `TaxonomyCheckboxes` и `GalleryUploadField` (оба — ProjectForm), `AdminSidebar`/`TokenGate`/`SaveAllButton` (все три — AdminLayout).
- `hooks/useLocale.ts` — 10 строк, содержит `createContext` — подтверждённое, осознанное исключение из нового правила про контексты.
- Colocated тесты, которые физически переезжают вместе с компонентами: `TerminalCursor.test.tsx`, `ProjectFilters.test.tsx`, `AdminDraftContext.test.tsx`, `AdminLocaleContext.test.tsx`, `TaxonomyCheckboxes.test.tsx`. Тесты, которые не переезжают, но импортируют переезжающие модули (нужно поправить только пути импорта): `ProjectForm.test.tsx`, `ProjectsList.test.tsx`, `TaxonomyEditor.test.tsx`.

## Commit Plan

- **Commit 1** (после задач 1-6): `refactor(home): decompose Home/index.tsx into 12 colocated section components`
- **Commit 2** (после задач 7-8): `refactor(components): colocate single-consumer components (ProjectFilters, ThemeToggle) with their pages`
- **Commit 3** (после задачи 9): `refactor(admin): move createContext files into admin/context/`
- **Commit 4** (после задач 10-12): `refactor(admin): colocate AdminLayout children, RichTextEditor, and ProjectForm-only fields`
- **Commit 5** (после задач 13-14): `chore: strip temporary refactor debug logs, verify tests and build`

Документационный чек-пойнт (ARCHITECTURE.md + DESCRIPTION.md) идёт после Commit 5, отдельным шагом `/aif-implement`/`/aif-docs` — не отдельная задача в этом списке.

## Tasks

### Phase 1: Декомпозиция Home/index.tsx (313 строк → 12 секций)

- [x] Task 1: Извлечь page-local константы в `pages/Home/constants.ts` (`stepNumber()`, `getTechHighlights()`, `buildStats()` — стало фабрикой вместо статического литерала, т.к. зависит от `t`/`profile`/рантайм-счётчиков)
- [x] Task 2: Извлечь `HeroSection` + `StatsSection`, переколокейтить `TerminalCursor` внутрь `HeroSection/`
- [x] Task 3: Извлечь `ServicesSection` + `ProcessSection` + `StackSection`
- [x] Task 4: Извлечь `TechHighlightsSection` + `FeaturedProjectsSection` + `CommitsSection`, переколокейтить `CommitActivityGrid` внутрь `CommitsSection/`
- [x] Task 5: Извлечь `ExperienceSection` + `TestimonialsSection` + `FaqSection` + `CtaSection`
- [x] Task 6: Пересобрать `pages/Home/index.tsx` как тонкий композиционный слой (data-loading + рендер 12 секций в исходном порядке) — 91 строка, typecheck зелёный
<!-- Commit checkpoint: tasks 1-6 -->

### Phase 2: Колокейт единственных потребителей в components/

- [x] Task 7: Перенести `ProjectFilters` → `pages/Projects/ProjectFilters/`
- [x] Task 8: Перенести `ThemeToggle` → `components/Nav/ThemeToggle/`
<!-- Commit checkpoint: tasks 7-8 -->

### Phase 3: Контексты → context/

- [x] Task 9: Перенести `AdminAuthContext`, `AdminLocaleContext`, `AdminDraftContext` → `admin/context/`
<!-- Commit checkpoint: task 9 -->

### Phase 4: Остальной колокейт в admin/

- [ ] Task 10: Перенести `AdminSidebar`, `TokenGate`, `SaveAllButton` → `admin/components/AdminLayout/*`
- [ ] Task 11: Перенести `RichTextEditor` → `admin/components/LocalizedField/RichTextEditor/`
- [ ] Task 12: Перенести `TaxonomyCheckboxes`, `GalleryUploadField` → `admin/editors/ProjectForm/*`
<!-- Commit checkpoint: tasks 10-12 -->

### Phase 5: Уборка и верификация

- [ ] Task 13: Снять все временные `[refactor:*]`-логи, добавленные в задачах 1-12
- [ ] Task 14: Прогнать полный набор тестов (`npm run test`) и билд/typecheck; исправить пропущенные импорты
<!-- Commit checkpoint: tasks 13-14 -->

Полные описания каждой задачи (конкретные пути файлов, номера строк, инструкции по логированию) — в task tracker текущей сессии (`TaskList`/`TaskGet`), задачи #1-#14.

## Next Steps

Для начала реализации: `/aif-implement`
