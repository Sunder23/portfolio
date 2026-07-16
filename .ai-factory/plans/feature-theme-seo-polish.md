# Implementation Plan: Этап 5 — Полировка (тема, локализованные мета-теги/OG, Lighthouse)

Branch: feature/theme-seo-polish
Created: 2026-07-17

## Settings
- Testing: no
- Logging: minimal
- Docs: yes  # обязательный docs-чекпоинт по завершении (задача 10 запускает /aif-docs)

## Roadmap Linkage
Milestone: "Этап 5 — Полировка"
Rationale: единственный незавершённый пункт роадмапа, покрывающий тему, мета-теги/OG и Lighthouse; favicon и README из критерия этапа уже закрыты ранее.

## Scope note (по итогам разведки)

- Favicon и README — уже сделаны (favicon.svg кастомный, README добавлен в `8b9e641`), в план не включены.
- Этап 4 (Лиды) на момент планирования не завершён — форма-заглушка без relay в Telegram. Этот план его не трогает, идёт параллельно/независимо.
- `next-themes` уже в зависимостях, но нигде не используется — просто не был подключён.
- Tailwind v4 через CSS (`@theme`/`@custom-variant dark`), токены `:root`/`.dark` в `app/src/index.css` уже полностью определены — переключатель темы нужен только на уровне React (ThemeProvider + toggle), CSS-токены трогать не требуется.
- HashRouter → один статичный `index.html` на весь сайт, поэтому локализованные per-route мета/OG теги технически возможны только клиентским хуком (crawler без исполнения JS увидит только статичный fallback из `index.html`) — это осознанное ограничение архитектуры, а не баг.

## Commit Plan
- **Commit 1** (после задач 1-3): "feat(theme): add dark/light theme toggle via next-themes"
- **Commit 2** (после задач 4-7): "feat(seo): add localized per-page meta/OG tags"
- **Commit 3** (после задач 8-10): "chore(polish): lighthouse fixes and final verification"

## Tasks

### Phase 1: Тема (dark/light)
- [x] Task 1: Подключить ThemeProvider (next-themes) в `app/src/main.tsx` — attribute="class", defaultTheme="system", enableSystem, disableTransitionOnChange
- [x] Task 2: Создать `app/src/components/ThemeToggle.tsx` на базе shadcn Switch + `useTheme()`, с mounted-guard от hydration mismatch (depends on 1)
- [x] Task 3: Добавить строки локализации (theme.light/theme.dark/theme.toggleLabel) в uk/ru/en.json, вмонтировать ThemeToggle в `PublicLayout.tsx` рядом с Nav (depends on 2)
<!-- Commit checkpoint: tasks 1-3 -->

### Phase 2: Локализованные мета-теги/OG
- [ ] Task 4: Создать хук `app/src/lib/useDocumentMeta.ts` — upsert document.title + meta description/og:title/og:description/og:locale/og:url
- [ ] Task 5: Добавить top-level ключ "meta" (title/description для home/projects/about/contact + фолбэк для projectDetail) в uk/ru/en.json
- [ ] Task 6: Подключить useDocumentMeta во все публичные страницы (Home, Projects, About, Contact — из словаря; ProjectDetail — из данных проекта) (depends on 4, 5)
- [ ] Task 7: Добавить статичные baseline OG-теги (og:type/og:site_name/og:image/twitter:card) и theme-color в `app/index.html` как фолбэк для non-JS краулеров (depends on 6)
<!-- Commit checkpoint: tasks 4-7 -->

### Phase 3: Lighthouse ≥90 и финал
- [ ] Task 8: Прогнать Lighthouse по всем публичным страницам (light+dark), зафиксировать baseline-оценки (depends on 3, 7)
- [ ] Task 9: Исправить найденные проблемы (контраст .dark-токенов, alt/aria-label, viewport/lang, lazy-loading) до ≥90 по всем категориям на всех страницах (depends on 8)
- [ ] Task 10: Финальная сквозная проверка (тема + локаль на всех страницах, admin не сломан) + обязательный docs-чекпоинт через /aif-docs (depends on 9)
<!-- Commit checkpoint: tasks 8-10 -->
