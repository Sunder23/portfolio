# Implementation Plan: Батчинг сохранений в админке (staging-стор + плавающая кнопка "Сохранить всё")

Branch: feature/admin-batch-save
Created: 2026-07-18

## Settings
- Testing: yes
- Logging: verbose
- Docs: yes  # mandatory docs checkpoint in /aif-implement

## Roadmap Linkage
Milestone: "Этап 7 — Батчинг сохранений"
Rationale: Roadmap сейчас заканчивается на Этапе 6 (админка в стиле WordPress) и незавершённом Этапе 4 (лиды); батчинг сохранений — следующий логический этап развития самой админки, независимый от Этапа 4.

## Research Context
Source: .ai-factory/RESEARCH.md (Active Summary)

Goal: Понять, что происходит при нескольких правках (посты + профиль) за одну сессию админки при текущей модели (save = мгновенный коммит), и спроектировать staging-модель, где несколько правок копятся и уходят одной пачкой по кнопке.

Constraints: Один юзер (соло-админка) — потеря черновика при закрытии вкладки без Save признана приемлемым риском. Отдельное персистентное хранилище (localStorage/IndexedDB/draft-ветка в GitHub) осознанно не нужно — только in-memory на время сессии.

Decisions:
- Текущая архитектура (Contents API + `cancel-in-progress` в deploy.yml) уже безопасна для нескольких независимых правок за сессию — разные файлы не конфликтуют по sha, финальный CI run деплоит актуальный HEAD.
- Единственная точка сохранения — глобальная плавающая кнопка "Сохранить всё"; локальные Save-кнопки в редакторах убираются.
- Картинки — вариант B: не грузить в GitHub по выбору файла, держать `{blob, previewUrl}` в памяти, грузить только на финальном Save (заодно чинит существующий orphan-баг с картинками).
- Точка врезки — `useEditorData<T>(path)`: сигнатура не меняется, реализация переезжает на глобальный Context, ключованный по `path`.
- Резолвинг картинок — generic-функция `resolvePendingImages()`, не завязанная на схему сущности (Project/Profile).

Open questions: Осиротевшие картинки при "Заменить" на уже сохранённом посте (старое фото остаётся в uploads/) — отдельная история, не в скоупе этого плана.

## Явно вне скоупа
- `TaxonomyEditor` (`app/src/admin/editors/TaxonomyEditor/index.tsx`) не трогаем: там нет черновика/dirty-состояния, каждое действие (add/rename/delete термина) сегодня — это мгновенный, самостоятельный коммит с собственным сообщением, и `countUsage()` перед удалением явно рассчитан на то, что данные в GitHub уже актуальны. Встраивание таксономий в батчинг — отдельная задача не в этом плане.
- Каскадная очистка осиротевших файлов в `uploads/` (при удалении/замене картинки) — не в скоупе.
- Один git-коммит на несколько JSON-файлов через Git Data API (blob→tree→commit→ref) — не в скоупе; батч сейчас = N последовательных `PUT` под одной кнопкой, что уже безопасно благодаря `concurrency: cancel-in-progress` в deploy.yml.

## Commit Plan
- **Commit 1** (после задач 1-3): `feat(admin): add draft staging context and pending-image resolver`
- **Commit 2** (после задач 4-6): `feat(admin): stage singleton editor saves via draft context, defer image uploads`
- **Commit 3** (после задач 7-8): `feat(admin): add floating Save All button and migrate ProjectForm to draft staging`

## Tasks

### Phase 1: Фундамент — стор и резолвер картинок
- [x] Задача 1: Добавить тип `PendingImage` и утилиту `resolvePendingImages()` — `app/src/admin/lib/resolvePendingImages.ts` (+ тест)
- [x] Задача 2: Создать `AdminDraftContext` (глобальный staging-стор) — `app/src/admin/components/AdminDraftContext/index.tsx` (+ тест)
- [x] Задача 3: Подключить `AdminDraftProvider` вокруг `<Outlet/>` в `AdminLayout` (depends on 2)
<!-- Commit checkpoint: задачи 1-3 -->

### Phase 2: Singleton-редакторы и отложенная загрузка картинок
- [x] Задача 4: Перевести `useEditorData` на чтение/запись через `AdminDraftContext` + авто-регистрация дефолтного flush (depends on 1, 2, 3). Добавлен `uploadPendingImage()` в `github.ts` (переиспользует логику из `useImageUpload.ts`). `useEditorData` вернул 4-й элемент `markClean` — понадобился для `TaxonomyEditor`, который коммитит мгновенно и должен ре-базилайнить draft-запись после своего собственного сохранения, а не оставлять её ложно "грязной".
- [x] Задача 5: Отложенная загрузка в `ImageUploadField`/`GalleryUploadField`, удалить `useImageUpload.ts` (depends on 1)
- [x] Задача 6: Убрать локальные кнопки "Сохранить" в `ProfileEditor`/`SkillsEditor` (depends on 4)
<!-- Commit checkpoint: задачи 4-6 -->

### Phase 3: Плавающая кнопка и ProjectForm
- [x] Задача 7: Плавающая кнопка "Сохранить всё" + обработчик batch-save (depends on 2, 3, 4). `ACTIONS_URL` экспортирован из `useAdminSave.ts` для переиспользования в тосте.
- [x] Задача 8: Перевести `ProjectForm` на `AdminDraftContext` (create/edit/rename flush) (depends on 1, 2, 3, 4, 5). `useDirtyState` удалён как мёртвый код (был только у ProjectForm). Кнопка "Отмена" теперь просто навигация — не сбрасывает черновик. Реальный клик через живой PAT в браузере не проверялся автоматически (нет Playwright по RULES.md, PAT — секрет пользователя) — нужна ручная проверка create/edit/rename перед мержем.
<!-- Commit checkpoint: задачи 7-8 -->
