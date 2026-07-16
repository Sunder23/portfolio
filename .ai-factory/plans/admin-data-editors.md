# Этап 2 — Админка: данные

**Ветка:** `feature/admin-data-editors`
**Создан:** 2026-07-16

## Settings

- **Testing:** нет — в проекте нет тестовой инфраструктуры, админка завязана на реальный GitHub API, юнит-тесты дадут мало ценности при текущем масштабе; ручная проверка надёжнее.
- **Logging:** Standard — INFO для ключевых событий (валидация токена, чтение/запись файла, retry на 409, ошибки), без подробного DEBUG.
- **Docs:** нет, warn-only. `RESEARCH.md` фиксирует, что документацию по workflow с админкой писать рано, пока `admin/` не реализован — этот план как раз доводит `admin/` до рабочего состояния, но саму доку пишем отдельным шагом позже (см. Research Context).

## Roadmap Linkage

- **Milestone:** "Этап 2 — Админка: данные"
- **Rationale:** Точное совпадение с неотмеченным milestone в `.ai-factory/ROADMAP.md`. Критерий этапа — «правка в админке → коммит в репо → сайт обновился» — прямо покрывается задачами этого плана.

## Research Context

Из `.ai-factory/RESEARCH.md` (Active Summary):
- Целевой workflow пользователя: локальная разработка (код) и правки контента через `/#/admin` коммитят в одну и ту же ветку `main`. **Готча на будущее:** `git pull` перед началом любой локальной сессии — иначе следующий пуш может конфликтовать с тем, что накоммитила админка, или тихо затереть её изменения. Не является частью кода этого плана, но должно попасть в будущую документацию.
- Документацию по workflow (dev-онбординг + редактура через админку) договорились писать **после** реализации `admin/` — по факту, а не как TODO-заглушку. Формат (единый README vs README + docs/) — открытый вопрос, решить в отдельном шаге, не в этом плане.

## Важное замечание о состоянии проекта

Публичные страницы (`Home`, `Projects`, `ProjectDetail`, `About`) сейчас — заглушки (кроме `Home`, который частично подключён к `getProfile()`). Формально это относится к Этапу 1, который в `ROADMAP.md` тоже не отмечен. Админка архитектурно независима от публичных страниц (общаются только через `data/*.json`, см. `ARCHITECTURE.md`), поэтому это не блокирует данный план — но публичные страницы остаются заглушками и после него. Их реализация — отдельный план.

## Известные особенности реализации (учтены в задачах ниже)

- **Пути в GitHub Contents API — репо-рутовые.** После переноса в `app/` данные лежат по `app/data/*.json`, а не `data/*.json`. Все пути в `admin/github.ts` и `admin/registry.ts` обязаны включать префикс `app/`.
- **Кириллица требует UTF-8-safe base64.** Обычные `btoa`/`atob` ломают не-Latin1 текст (контент на украинском/русском) — нужна конвертация через `TextEncoder`/`TextDecoder`.
- **`sha` не кэшируется между сохранениями** — перед каждым PUT свежий GET.
- **401 → сброс на TokenGate**, не необработанное исключение.
- **409 после одного повтора → явная ошибка** пользователю, не тихий откат и не бесконечный ретрай.
- Загрузка/сжатие картинок — Этап 3, вне скоупа. Поля `cover`/`gallery`/`avatar` в этом плане — обычные текстовые поля с путём.

## Tasks

### Phase 1 — Foundation

- [x] 1. **Add shadcn/ui primitives and mount point for Toaster** — `app/src/components/ui/*`
- [x] 2. **Create PAT localStorage module** — `app/src/admin/pat.ts`
- [x] 3. **Build GitHub Contents API client** — `app/src/admin/github.ts`
- [x] 4. **Create AdminAuthContext + useAdminAuth hook** — `app/src/admin/AdminAuthContext.tsx` (blocked by 2, 3)
- [x] 5. **Build TokenGate.tsx** — `app/src/admin/TokenGate.tsx` (blocked by 1, 3, 4)
- [x] 6. **Build AdminLayout.tsx** — `app/src/admin/AdminLayout.tsx` (blocked by 4, 5)
- [x] 7. **Build reusable LocalizedField** — `app/src/admin/LocalizedField.tsx` (blocked by 1)
- [x] 8. **Add markdown preview** — `app/src/admin/MarkdownPreview.tsx`, `app/package.json` (blocked by 1)
- [x] 9. **Build shared useAdminSave hook** — `app/src/admin/useAdminSave.ts` (blocked by 3, 4)

### Phase 2 — Editors

- [x] 10. **Build ProjectsEditor (CRUD)** — `app/src/admin/editors/ProjectsEditor.tsx` (blocked by 6, 7, 8, 9)
- [x] 11. **Build ProfileEditor** — `app/src/admin/editors/ProfileEditor.tsx` (blocked by 6, 7, 9)
- [x] 12. **Build SkillsEditor** — `app/src/admin/editors/SkillsEditor.tsx` (blocked by 6, 9)

### Phase 3 — Wiring

- [ ] 13. **Create admin/registry.ts** — `app/src/admin/registry.ts` (blocked by 10, 11, 12)
- [ ] 14. **Wire admin routes and lazy-load the admin module** — `app/src/pages/Admin.tsx`, `app/src/App.tsx` (blocked by 13, 6)

Full task descriptions with exact APIs, logging requirements, and file-level detail are tracked in the task list (`TaskList` / `/tasks`), tasks #1–#14.

## Commit Plan

- **Commit 1** (после задач 1–3): `chore(admin): scaffold shadcn primitives, PAT storage, GitHub Contents API client`
- **Commit 2** (после задач 4–6): `feat(admin): add auth context, TokenGate, AdminLayout`
- **Commit 3** (после задач 7–9): `feat(admin): add LocalizedField, markdown preview, shared save hook`
- **Commit 4** (после задач 10–12): `feat(admin): add Projects/Profile/Skills editors`
- **Commit 5** (после задач 13–14): `feat(admin): wire registry and lazy-loaded admin routes`

## Критерий готовности (из ROADMAP.md)

Правка в админке → коммит в репо → сайт обновился. Проверить вручную: залогиниться через TokenGate валидным fine-grained PAT (права только на этот репозиторий, `Contents: Read/Write`), отредактировать проект/профиль/скиллы, убедиться что коммит появился в репозитории с ожидаемым сообщением, дождаться пересборки Pages (~1–2 мин) и увидеть изменение (когда публичные страницы перестанут быть заглушками) либо напрямую в `app/data/*.json` на `main`.
