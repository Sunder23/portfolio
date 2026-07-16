# Этап 1 — Публичная часть + i18n

**Ветка:** `feature/public-pages-i18n`
**Создан:** 2026-07-17

## Settings

- **Testing:** нет — в проекте нет тестовой инфраструктуры (то же решение, что и для Этапа 2/admin-data-editors.md); ручная проверка в браузере надёжнее при текущем масштабе.
- **Logging:** Standard — INFO для ключевых событий (загрузка данных, смена локали, фолбэк Localized-поля на uk, не найденные проекты), без подробного DEBUG.
- **Docs:** нет, warn-only. Документация по проекту (README/docs) по-прежнему отложена до отдельного шага (см. RESEARCH.md).

## Roadmap Linkage

- **Milestone:** "Этап 1 — Публичная часть + i18n"
- **Rationale:** Точное совпадение с неотмеченным milestone в `.ai-factory/ROADMAP.md`. Критерий этапа — «контент правится в JSON руками → после пуша меняется на сайте; переключение uk/ru/en работает» — прямо покрывается задачами этого плана.

## Состояние на момент планирования

Обнаружено при разведке кода (см. явный запрос пользователя проверить факт реализации):

- Все 4 публичные страницы (`Home`, `Projects`, `ProjectDetail`, `About`) — заглушки без чтения данных (кроме `Home`, который частично читает `profile.name` напрямую, без локализации).
- i18n-инфраструктура (`lib/i18n.ts`, `lib/locale.ts`, `hooks/useLocale.ts`, литеральные per-locale роуты в `App.tsx`) уже реализована и работает, но словари `locales/{uk,ru,en}.json` — пустые `{}`, хук `useLocalized()` (упомянутый как конвенция в `ARCHITECTURE.md`) ещё не создан.
- `app/data/skills.json` — `{}`, не соответствует типу `SkillCategory[]`, ожидаемому `getSkills()` — схемный баг, требует исправления.
- `app/data/projects.json` — пустой массив `[]`, нет тестового контента для визуальной проверки критерия этапа.
- Общих переиспользуемых публичных компонентов (`Nav`, `ProjectCard`, `LocaleSwitcher`, layout) не существует — есть только shadcn-примитивы в `components/ui/`.

## Tasks

### Phase 1 — Foundation (данные + i18n-строки)

- [x] 1. **Заполнить словари UI-строк `locales/{uk,ru,en}.json`** — `app/src/locales/uk.json`, `ru.json`, `en.json`
- [x] 2. **Создать хук `useLocalized`** — `app/src/hooks/useLocalized.ts` (blocked by 1)
- [x] 3. **Исправить схему `app/data/skills.json`** (`{}` → `SkillCategory[]`)
- [x] 4. **Наполнить `app/data/projects.json` и `profile.json` тестовым контентом**

**Commit checkpoint 1** — после задач 1–4: `feat: seed i18n strings and content data for public pages`

### Phase 2 — Общие компоненты

- [x] 5. **Создать `Nav` и `LocaleSwitcher`** — `app/src/components/Nav.tsx`, `app/src/components/LocaleSwitcher.tsx` (blocked by 1)
- [x] 6. **Создать `ProjectCard`** — `app/src/components/ProjectCard.tsx` (blocked by 2)
- [x] 7. **Создать `PublicLayout` и подключить в `App.tsx`** — `app/src/components/PublicLayout.tsx`, `app/src/App.tsx` (blocked by 5)

**Commit checkpoint 2** — после задач 5–7: `feat: add public layout, nav, and project card components`

### Phase 3 — Страницы

- [x] 8. **Реализовать `Home.tsx`** — `app/src/pages/Home.tsx` (blocked by 2, 4, 7)
- [x] 9. **Реализовать `Projects.tsx`** — `app/src/pages/Projects.tsx` (blocked by 6, 4, 7)
- [x] 10. **Реализовать `ProjectDetail.tsx`** — `app/src/pages/ProjectDetail.tsx` (blocked by 2, 4, 7)
- [x] 11. **Реализовать `About.tsx`** — `app/src/pages/About.tsx` (blocked by 2, 3, 4, 7)

**Commit checkpoint 3** — после задач 8–11: `feat: implement public pages with localized content`

### Phase 4 — Проверка

- [x] 12. **Финальная проверка Этапа 1** (blocked by 8, 9, 10, 11) — `npm run build`, ручная проверка uk/ru/en на всех 4 страницах, проверка что admin/* не сломан

  `npm run build` (tsc -b && vite build) и `npm run lint` прошли чисто (только 4 предсуществующих lint-предупреждения в shadcn/ui-примитивах и AdminAuthContext, не связаны с этим этапом). Автоматизированную браузерную проверку через Playwright пользователь отклонил; ручная проверка в браузере остаётся на пользователе.

**Commit checkpoint 4** (финальный) — после задачи 12, если проверка нашла и потребовала правок: `fix: address issues found in Этап 1 verification`
