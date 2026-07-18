# Research

Updated: 2026-07-18 12:30
Status: ready-for-plan

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: Батчинг сохранений в админке — плавающая кнопка "Сохранить всё" + отложенная загрузка картинок
Goal: Понять, что происходит при нескольких правках (посты + профиль) за одну сессию админки при текущей модели (save = мгновенный коммит), и спроектировать staging-модель, где несколько правок копятся и уходят одной пачкой по кнопке.
Constraints: Один юзер (соло-админка) — потеря черновика при закрытии вкладки без Save признана приемлемым риском. Отдельное персистентное хранилище (localStorage/IndexedDB/draft-ветка в GitHub) осознанно не нужно — только in-memory на время сессии.
Decisions:
- Текущая архитектура уже безопасна для нескольких независимых правок за сессию: разные файлы (data/projects/<slug>.json, data/profile.json) → разные пути → sha-конфликтов между ними в принципе нет. `concurrency: group: pages, cancel-in-progress: true` в deploy.yml гарантирует, что финальный workflow run задеплоит актуальный HEAD, даже если несколько коммитов пушатся подряд и промежуточные run'ы отменяются — конечное состояние сходится само.
- Известные риски сегодняшней модели (save = мгновенный коммит из каждого editor'а): (1) нет атомарности между независимыми Save — если токен истечёт между сохранением поста 2 и профиля, получаем частично применённое состояние; (2) конкурентная правка ОДНОГО файла из двух вкладок — retry-once в `withConflictRetry()` (app/src/admin/lib/github.ts:50-66) перезатирает содержимым из формы без merge (last-write-wins); (3) картинки грузятся в GitHub сразу при выборе файла (useImageUpload.ts), а JSON поста — только при Save, из-за чего уже сегодня возможны осиротевшие файлы в uploads/, если бросить форму не сохранив.
- Решение — плавающая кнопка "Сохранить всё": in-memory (React Context/аналог) staging-стор, переживающий переход между роутами admin, но НЕ переживающий обновление/закрытие вкладки (осознанно).
- Точка врезки — `useEditorData<T>(path)` (app/src/admin/hooks/useEditorData.ts): сигнатура `[data, setData, isDirty]` не меняется, меняется только реализация — вместо локального `useState` читает/пишет запись в глобальном `AdminDraftProvider` по ключу `path`. ProfileEditor/SkillsEditor/TaxonomyEditor/ProjectForm не переписываются.
- Форма стора (финально): `AdminDraftProvider` монтируется в `AdminLayout` (index.tsx, вокруг `<Outlet/>`), хранит `entries: Record<path, DraftEntry>` где `DraftEntry<T> = { data: T; baseline: string }`. Публичный API: `getEntry`, `setEntry`, `captureBaseline`, `isDirty(path)`, `dirtyPaths: string[]`, `clearAll()`. Стор ничего не знает про схемы конкретных сущностей (Project/Profile/Skills) — просто `Record<path, unknown>`.
- UX сохранения (принято): локальные кнопки "Сохранить" в ProfileEditor/SkillsEditor/TaxonomyEditor/ProjectForm убираются полностью. Единственная точка сохранения — глобальная плавающая кнопка в AdminLayout ("Сохранить всё (N)", скрыта/disabled при `dirtyPaths.length === 0`).
- Картинки — вариант B (принято): не грузить в GitHub сразу по выбору файла. `compressImage()` (imageCompress.ts) остаётся локальным как сейчас, но `uploadImageToGithub()` (github.ts:222) переезжает из ImageUploadField в единый шаг "резолвинг" на финальном Save. Контракт `value` меняется с `string` на `string | PendingImage` (`{blob, previewUrl}`), превью через `URL.createObjectURL`. Это заодно чинит существующий orphan-баг с картинками, а не только не усугубляет его.
- Галерея (GalleryUploadField) отдельной логики не требует — это просто `string[]`, отрендеренный через тот же ImageUploadField на каждый слот; переход на `(string | PendingImage)[]` не меняет add/remove/update по индексу.
- Резолвинг картинок — generic, без знания схемы сущности: одна рекурсивная функция `resolvePendingImages(value)` проходит по объекту/массиву и подменяет любое значение вида `{blob, previewUrl}` на загруженный путь, независимо от того, в каком поле оно лежит (`cover`, `gallery[i]`, что угодно ещё).
- Порядок финального Save (в обработчике кнопки, AdminLayout): для каждого `dirtyPath` — `resolvePendingImages(entries[path].data)` → `saveFile(path, resolved, "admin: update " + path, token)` по очереди → `clearAll()`. Переиспользует существующие `saveFile`/`uploadImageToGithub` из github.ts без изменений. Edge case: сеть/токен отваливается в середине — часть уже закоммичена, часть остаётся dirty в сторе (можно повторить, ничего не потеряно из UI) — редкий сбой, не системный риск как сегодня.
- Технический нюанс на будущее (не блокер): чтобы это было буквально ОДНИМ git-коммитом на несколько JSON-файлов, saveFile/createFile (Contents API, PUT = 1 коммит) не годятся — нужен Git Data API (blob → tree → commit → update ref). Пока принято: N отдельных PUT подряд под одной кнопкой — уже безопасно благодаря cancel-in-progress, просто не "1 коммит", а "N коммитов почти одновременно".
Open questions: Что делать с осиротевшими картинками при "Заменить" на уже сохранённом посте (старое фото остаётся в uploads/ — отдельная история, не связана со staging-моделью, можно не решать в этом плане).
Success signals: Реализован `AdminDraftProvider` + плавающая кнопка "Сохранить всё" + отложенная загрузка картинок (вариант B) для одиночного поля и галереи; локальные Save-кнопки убраны.
Next step: /aif-plan на реализацию.
<!-- aif:active-summary:end -->

## Sessions
<!-- aif:sessions:start -->
### 2026-07-16 23:15 — Деплой на GitHub Pages: диагностика 404 + план доки на потом
What changed: Диагностирована и устранена причина падения deploy-pages@v4 (Source не был выставлен на GitHub Actions в Settings → Pages). Обсуждён и отложен вопрос документации workflow.
Key notes: Node 20 deprecation warning — красная селёдка, не связан с реальной причиной падения. Реальная ошибка — "Failed to create deployment (status 404) ... Ensure GitHub Pages has been enabled". После правки Source в UI деплой прошёл успешно.
Links (paths): .github/workflows/deploy.yml, AGENTS.md (уже отмечал README.md как TODO), PLAN.md (Этап 2 — админка)

### 2026-07-18 12:00 — Батчинг сохранений в админке: staging-стор + отложенная загрузка картинок
What changed: Разобрали, что текущая архитектура (Contents API + `cancel-in-progress` в deploy.yml) уже безопасна для нескольких независимых правок за сессию (разные файлы = нет sha-конфликтов, финальный CI run деплоит актуальный HEAD). Спроектирована плавающая кнопка "Сохранить всё" поверх in-memory staging (без localStorage — приемлемо для одного юзера) и отложенная загрузка картинок (вариант B) для одиночного поля и галереи.
Key notes: Существующее разделение `compressImage()`/`uploadImageToGithub()` в коде уже готово к переносу сетевой загрузки в момент финального Save — рефакторинг дешевле, чем казалось на старте. `GalleryUploadField` переиспользует `ImageUploadField` на каждый элемент массива, отдельной логики для галереи не нужно. Вариант B заодно чинит существующий orphan-баг с картинками (сегодня фото коммитится в GitHub сразу при выборе файла, до Save поста).
Links (paths): app/src/admin/lib/github.ts, app/src/admin/hooks/useAdminSave.ts, app/src/admin/hooks/useEditorData.ts, app/src/admin/hooks/useImageUpload.ts, app/src/admin/components/ImageUploadField/index.tsx, app/src/admin/components/GalleryUploadField/index.tsx, .github/workflows/deploy.yml
<!-- aif:sessions:end -->
