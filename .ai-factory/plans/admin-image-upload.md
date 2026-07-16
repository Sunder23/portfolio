# Этап 3 — Админка: картинки

**Ветка:** `feature/admin-image-upload`
**Создан:** 2026-07-17

## Settings

- **Testing:** нет — как и в плане Этапа 2, тестовой инфраструктуры в проекте нет (подтверждено: ни vitest, ни `@testing-library/*` не установлены, тестовых файлов нет); логика завязана на canvas API браузера и реальный GitHub API — ручная проверка надёжнее на этом масштабе.
- **Logging:** Standard — INFO для ключевых событий (начало/конец сжатия с итоговым размером и качеством, путь и размер перед загрузкой, успех/ошибка PUT), без пошагового DEBUG по итерациям сжатия.
- **Docs:** нет, warn-only. Документация по-прежнему отложена до отдельного шага (см. `RESEARCH.md`), этот план её не блокирует.

## Roadmap Linkage

- **Milestone:** "Этап 3 — Админка: картинки"
- **Rationale:** Точное совпадение со следующим неотмеченным milestone в `.ai-factory/ROADMAP.md`. Критерий этапа — «загруженная картинка ≤300 КБ и отображается в проекте» — прямо покрывается задачами этого плана.

## Контекст кодовой базы (из разведки перед планированием)

- **`app/src/admin/github.ts` сегодня — только JSON.** `getFile`/`putFile`/`saveFile` всегда делают `JSON.stringify` перед base64-кодированием и `JSON.parse` после декодирования. Нужен отдельный бинарный путь записи, не трогающий существующие функции.
- **401/409 контракт уже есть и должен быть переиспользован:** `GithubAuthError` (401) и `GithubConflictError` (409, ровно один повтор) — новый код загрузки картинок обязан бросать те же классы ошибок, чтобы `useAdminSave`-подобный обработчик в UI вёл себя одинаково.
- **`OWNER`/`REPO` захардкожены в `github.ts`, без параметра branch** — новый upload-хелпер следует тому же паттерну, ничего дополнительного проводить не нужно.
- **`cover`/`gallery`/`avatar` в `types.ts` — обычные `string`/`string[]`**, никакой доп. схемы не требуется.
- **`app/public/uploads/` уже существует** (пустой, с `.gitkeep`) — загруженные файлы кладутся туда как `app/public/uploads/<uuid>.webp` через Contents API (путь репо-рутовый, с префиксом `app/`, как зафиксировано в плане Этапа 2).
- **Критичный нюанс с базовым путём:** `vite.config.ts` — `base: '/portfolio/'` в проде, `'/'` в dev. `ProjectCard.tsx`/`ProjectDetail.tsx` рендерят `<img src={project.cover}>` без какого-либо префикса. Значит сохранённая строка должна уже содержать правильный префикс (`import.meta.env.BASE_URL`) на момент загрузки — это возлагается на `useImageUpload` (задача 3), чтобы не трогать код публичных страниц вообще.
- **Нет установленной библиотеки сжатия изображений** (ни `browser-image-compression`, ничего) — реализуем через `<canvas>` + `canvas.toBlob('image/webp', quality)`, как явно описано в `DESCRIPTION.md`/`ARCHITECTURE.md` ("canvas → webp"). Новая npm-зависимость не добавляется.
- **Нет shadcn `Progress`/plain `Dialog`** — сознательно не добавляем: индикации через `lucide-react` spinner (`Loader2`) + disabled-кнопка достаточно, `lucide-react` уже используется как `iconLibrary` в `components.json`.
- **Уникальность имени файла** (`crypto.randomUUID()`) исключает 409-коллизии при создании — retry на 409 всё равно реализуется для устойчивости, но без merge sha (это всегда create, не update).

## Tasks

### Phase 1 — Foundation (сжатие + бинарная загрузка)

- [x] 1. **Add canvas-based image compression helper** — `app/src/admin/imageCompress.ts`
- [x] 2. **Add binary upload support to GitHub Contents API client** — `app/src/admin/github.ts`
- [x] 3. **Build useImageUpload hook** — `app/src/admin/useImageUpload.ts` (blocked by 1, 2)

### Phase 2 — UI-компоненты

- [x] 4. **Build ImageUploadField component (single image)** — `app/src/admin/ImageUploadField.tsx` (blocked by 3)
- [x] 5. **Build GalleryUploadField component (multi-image)** — `app/src/admin/GalleryUploadField.tsx` (blocked by 4)

### Phase 3 — Wiring

- [ ] 6. **Wire cover + gallery image upload into ProjectsEditor** — `app/src/admin/editors/ProjectsEditor.tsx` (blocked by 4, 5)
- [ ] 7. **Wire avatar image upload into ProfileEditor** — `app/src/admin/editors/ProfileEditor.tsx` (blocked by 4)

Полные описания задач с точными сигнатурами, требованиями к логированию и деталями по файлам — в списке задач (`TaskList` / `/tasks`), задачи #1–#7.

## Commit Plan

- **Commit 1** (после задач 1–3): `feat(admin): add canvas image compression, binary upload client, useImageUpload hook`
- **Commit 2** (после задач 4–5): `feat(admin): add image upload UI components (single + gallery fields)`
- **Commit 3** (после задач 6–7): `feat(admin): wire image upload into project cover/gallery and profile avatar`

## Критерий готовности (из ROADMAP.md)

Загруженная картинка ≤300 КБ и отображается в проекте. Проверить вручную: в `ProjectsEditor` загрузить реальное изображение в поле обложки и в галерею, убедиться что итоговый файл в `app/public/uploads/*.webp` ≤300 КБ, коммит появился в репозитории, после пересборки Pages (~1–2 мин) картинка отображается на `ProjectCard`/`ProjectDetail` без битой ссылки (проверка именно на задеплоенном сайте — важно из-за разницы `base` между dev и prod). Аналогично для `avatar` в `ProfileEditor`.
