# Implementation Plan: Рефакторинг структуры файлов и компонентов (admin + весь проект)

Branch: feature/refactor-admin-structure
Created: 2026-07-18

## Settings
- Testing: no
- Logging: standard — сохранять текущий уровень (`[module/name]`-префиксы) при переносе кода; не добавлять новую verbose-логику. Отдельная задача (Task 9) снимает уже накопившиеся debug-логи.
- Docs: yes — обязательный чек-пойнт документации в конце (ARCHITECTURE.md + DESCRIPTION.md)

## Roadmap Linkage
Milestone: "none"
Rationale: Пропущено по решению пользователя — это внутренний рефакторинг/техдолг, а не отдельный продуктовый этап.

## Контекст аудита

Полный обзор `app/src/` (кроме `admin/`) и `app/src/admin/` был проведён двумя параллельными агентами. Ключевые находки:

**`app/src/admin/`:**
- `github.ts` (251 строк) — 6-кратное дублирование блока обработки 401/409/generic-ошибок (`fetchContents`, `putFile`, `listDir`, `createFile`, `deleteFile`, `putBinary`) + дублированная логика retry-once-on-409 между `saveFile` и `uploadImage`.
- `editors/ProjectsEditor.tsx` (378 строк, самый большой файл в проекте) — совмещает `ProjectsList` + `ProjectRow` + `ProjectForm` + data-хелперы (`loadProjectEntries`, `emptyProject`) в одном файле; `handleSave` (create/update/rename с двумя сетевыми вызовами) — самая сложная логика в `admin/` без единого теста.
- `AdminLayout.tsx` (186 строк) — смешивает проверку сессии (сетевые гонки/отмена), UI хедера и рендер дерева сайдбара.
- `RichTextEditor.tsx` — toolbar из 7 почти идентичных `<Button>`-блоков вместо data-driven массива.
- Дублирование паттерна загрузки данных (`useEffect(() => { if (!token) return; getFile(...).then(setState) }, [token])`) и кнопки "Сохранение…" across `ProfileEditor`, `SkillsEditor`, `TaxonomyEditor`, `ProjectForm`.
- `SkillsEditor.tsx` — хранит массив через `items.join(', ')` / `.split(',')`, теряет данные при значениях с запятой внутри.
- `registry.ts` — по названию "реестр", но реально покрывает только 2 из 4 типов контента (Profile, Skills); Projects и Taxonomies захардкожены прямо в `pages/Admin.tsx`. Не баг, но вводит в заблуждение по названию — решение: не форсировать единую абстракцию (Projects/Taxonomies имеют другую форму — список/CRUD против singleton), а зафиксировать это явно в документации.

**Остальной `app/src/`:**
- Повторяющийся паттерн `useState(null)` → `useEffect(fetch)` → `if (!x) return loading` в `Home.tsx`, `About.tsx`, `Projects.tsx`, `ProjectDetail.tsx` — нет общего хука.
- Debug `console.info`/`console.warn` разбросаны по `pages/*`, `lib/data.ts`, `App.tsx` (включая явно забытый `[FIX:admin-locale-redirect]` trace в `RootRedirect`).
- `lib/useDocumentMeta.ts` — это React-хук, но лежит в `lib/`, хотя в проекте уже есть `hooks/` именно для этого.
- `components/`, `locales/`, `types.ts`, `lib/data.ts`, `lib/slug.ts` — без замечаний, соответствуют ARCHITECTURE.md.

Мёртвого кода не найдено ни в одной из веток аудита.

## Конвенция: компонент = папка (добавлено по запросу пользователя)

- **Алиас подтверждён:** `@/*` → `./src` настроен в `app/tsconfig.json` и `app/vite.config.ts`, используется во всех 160 текущих импортах (относительных `../`-импортов в проекте нет). Благодаря алиасу перенос файла `X.tsx` → `X/index.tsx` **не требует правки импортов у потребителей** — стандартное разрешение модулей находит `index.tsx` внутри одноимённой папки автоматически; менять нужно только тесты/файлы, которые физически переезжают в ту же папку.
- **Область:** весь `app/src/` — `admin/`, `admin/editors/`, `pages/`, `components/` (без `components/ui/`), корневой `App.tsx`.
- **Что считается компонентом:** только `.tsx`-файлы, которые экспортируют React-компонент с JSX (включая context-провайдеры вроде `AdminAuthContext.tsx`/`AdminLocaleContext.tsx` — у них есть JSX-провайдер). Хуки (`useX.ts`) и чистые модули (`github.ts`, `slug.ts`, `navConfig.ts`, `registry.ts`, `projectsData.ts`) остаются плоскими файлами — по решению пользователя это НЕ компоненты.
- **Структура папки:** `ComponentName/index.tsx` — главный файл; `ComponentName/ComponentName.test.tsx` — тест (если есть), не `index.test.tsx`, чтобы название было видно во вкладках редактора и в выводе test-раннера; `ComponentName/ComponentName.module.css` — модульные стили, если/когда понадобятся (сейчас в проекте их нет, чистый Tailwind).
- **Исключение — `app/src/components/ui/*`:** это shadcn/ui-примитивы, `components.json` (`aliases.ui: "@/components/ui"`) явно ожидает их плоскими в `components/ui/`, так работает `npx shadcn add`/`diff`. Перенос в папки сломает штатное обновление этих файлов через shadcn CLI — оставляем как есть.
- **`main.tsx`** — это entry point (вызывает `createRoot(...).render(<App/>)`), не компонент в смысле этой конвенции — остаётся в корне `src/`.
- Компоненты, которые и так создаются/переносятся в задачах 2–6 (например `ProjectsList`, `ProjectForm`, `AdminSidebar`, `RichTextEditor`, `ProfileEditor`, `SkillsEditor`, `TaxonomyEditor`, публичные страницы) сразу создаются в форме `Name/index.tsx` — отдельно их второй раз не переносим. Всё, что этими задачами не затронуто, переносится отдельной задачей 8.

## Commit Plan

- **Commit 1** (после задач 1-4): `refactor(admin): dedupe github.ts error handling, split ProjectsEditor and AdminLayout into folder-per-component, data-driven RichTextEditor toolbar`
- **Commit 2** (после задач 5-6): `refactor: extract shared data-loading hooks for admin editors and public pages, migrate touched components to folder-per-component`
- **Commit 3** (после задачи 7): `chore: relocate useDocumentMeta hook to hooks/`
- **Commit 4** (после задачи 8): `refactor: move remaining components to folder-per-component structure (Name/index.tsx)`
- **Commit 5** (после задач 9-11): `chore: strip debug logging, verify build/tests, update architecture docs`
- **Commit 6** (после задачи 12): `chore: flatten App/index.tsx back to App.tsx`
- **Commit 7** (после задач 13-14): `refactor(admin): group flat modules into lib/ and components into components/`
- **Commit 8** (после задачи 15): `refactor(admin): move hooks into hooks/ subfolder`
- **Commit 9** (после задач 16-17): `chore: verify build/tests, update architecture docs for admin/ subfolder grouping`

## Tasks

### Phase 1: Admin — слой данных (github.ts)

- [x] Task 1: Убрать дублирование обработки ошибок в `app/src/admin/github.ts`

### Phase 2: Admin — разбиение крупных компонентов (сразу в форме папка/index.tsx)

- [x] Task 2: Разбить `app/src/admin/editors/ProjectsEditor.tsx` на `editors/ProjectsList/index.tsx`, `editors/ProjectForm/index.tsx`, `editors/projectsData.ts`
- [x] Task 3: Разбить `app/src/admin/AdminLayout.tsx` на `admin/useSessionCheck.ts` хук + `admin/AdminSidebar/index.tsx` компонент; сам `AdminLayout.tsx` тоже переносится в `admin/AdminLayout/index.tsx`
- [x] Task 4: Сделать toolbar data-driven и перенести в `app/src/admin/RichTextEditor/index.tsx`
<!-- Commit checkpoint: tasks 1-4 -->

### Phase 3: Admin — общий хук загрузки данных редактора

- [x] Task 5: Вынести `useEditorData` хук, применить в `ProfileEditor`, `SkillsEditor`, `TaxonomyEditor`, `ProjectForm`; поправить хранение массива в `SkillsEditor`; перенести `ProfileEditor`, `SkillsEditor`, `TaxonomyEditor` в форму `Name/index.tsx`

### Phase 4: Публичная часть — общий хук загрузки данных

- [x] Task 6: Вынести `useAsyncData` хук, применить в `Home`, `About`, `Projects`, `ProjectDetail`; перенести эти 4 страницы в форму `Name/index.tsx`
<!-- Commit checkpoint: tasks 5-6 -->

### Phase 5: Сквозная уборка и завершение миграции на папки

- [x] Task 7: Перенести `app/src/lib/useDocumentMeta.ts` → `app/src/hooks/useDocumentMeta.ts`
<!-- Commit checkpoint: task 7 -->
- [x] Task 8: Перенести оставшиеся компоненты в форму `Name/index.tsx` (depends on 1-7): `admin/TokenGate`, `admin/GalleryUploadField`, `admin/ImageUploadField`, `admin/AdminAuthContext`, `admin/AdminLocaleContext` (+ колокейтед тест), `admin/LocalizedField`, `admin/TaxonomyCheckboxes` (+ колокейтед тест), `pages/Admin`, `pages/Contact`, `components/Nav`, `components/ProjectCard`, `components/PublicLayout`, `components/LocaleSwitcher`, `components/ThemeToggle`, `components/MarkdownContent`, корневой `App` → `src/App/index.tsx`. НЕ трогать `components/ui/*` (см. раздел про конвенцию выше)
<!-- Commit checkpoint: task 8 -->

- [x] Task 9: Убрать/зачистить debug-логи (`console.info`/`console.warn`) по `pages/*`, `lib/data.ts`, `App/index.tsx` (включая `[FIX:admin-locale-redirect]` в `RootRedirect`), появившиеся в ходе задач 1-8 в `admin/*` (depends on 8)

### Phase 6: Верификация и документация

- [x] Task 10: Прогнать `npm run build` и `npm run test` в `app/`, убедиться что ничего не сломано, включая разрешение алиасных импортов на новые папки (depends on 9)
- [x] Task 11: Обновить `.ai-factory/ARCHITECTURE.md` и `.ai-factory/DESCRIPTION.md` под новую структуру (папка-на-компонент, разбиение `ProjectsEditor`/`AdminLayout`, `useEditorData`/`useAsyncData`, `registry.ts` покрывает только singleton-редакторы, исключение `components/ui/*` из конвенции папок) (depends on 10)
<!-- Commit checkpoint: tasks 9-11 -->

## Амендмент: группировка `admin/` по типу + плоский `App.tsx` (продолжение того же рефакторинга, добавлено по запросу пользователя после Task 11)

После Task 8 `app/src/admin/` стал плоской смесью из ~10 папок-компонентов, 4 хуков и 6 утильных модулей на одном уровне — сложно ориентироваться. Решение: сгруппировать `admin/` **по типу**, зеркалируя структуру верхнего уровня `src/` (`App/`, `pages/`, `components/`, `hooks/`, `lib/`):

- **`admin/components/`** — все папки-компоненты (JSX): `AdminLayout/`, `AdminSidebar/`, `AdminAuthContext/`, `AdminLocaleContext/` (+ колокейтед тест), `TokenGate/`, `LocalizedField/`, `TaxonomyCheckboxes/` (+ колокейтед тест), `ImageUploadField/`, `GalleryUploadField/`, `RichTextEditor/`.
- **`admin/hooks/`** — `useAdminSave.ts`, `useEditorData.ts`, `useImageUpload.ts`, `useSessionCheck.ts`.
- **`admin/lib/`** — чистые модули без JSX: `github.ts` (+ `github.test.ts`), `imageCompress.ts`, `navConfig.ts`, `pat.ts`, `registry.ts`.
- **`admin/editors/`** — без изменений (уже сгруппирован).

Порядок переноса (13 → 14 → 15) выбран так, чтобы каждая задача правила импорты только у **потребителей своих же** файлов — не имеет значения, переехал ли сам потребитель, поскольку все импорты используют абсолютный алиас `@/*`, а не относительные пути. `lib/` переносится первым (ни от чего внутри `admin/` не зависит), затем `components/` (зависит от `lib/`), затем `hooks/` (зависит от `components/` и `lib/`).

Отдельно: `app/src/App/index.tsx` возвращается в плоский `app/src/App.tsx` — у него нет колокейтед-теста, и папка ради одного файла (entry-компонент, не переиспользуемый) избыточна. Это единственное исключение из конвенции «компонент = папка», задокументированное явно.

Все карты импортов ниже получены через `grep -rn "@/admin/<module>['\"]"` по `app/src/` перед составлением плана — списки файлов в описаниях задач 13-15 исчерпывающие на момент планирования.

### Phase 7: Группировка `admin/` по типу + плоский `App.tsx`

- [x] Task 12: Вернуть `app/src/App/index.tsx` → `app/src/App.tsx` (плоский файл, без папки). Удалить папку `App/`. Проверить, что `app/src/main.tsx` (`import App from './App'`) по-прежнему резолвится корректно — правка импорта не требуется, но нужно явно собрать проект и убедиться, что резолвится именно новый `App.tsx`, а не осталась пустая папка.
<!-- Commit checkpoint: task 12 -->

- [ ] Task 13: Создать `app/src/admin/lib/` и перенести туда `github.ts`, `github.test.ts`, `imageCompress.ts`, `navConfig.ts`, `pat.ts`, `registry.ts`. Обновить импорты `@/admin/<module>` → `@/admin/lib/<module>` во всех потребителях:
  - `github.ts` → `admin/editors/ProjectForm/index.tsx`, `admin/editors/projectsData.ts`, `admin/editors/ProjectsList/index.tsx`, `admin/editors/TaxonomyEditor/index.tsx`, `admin/lib/github.test.ts` (сам тест), `admin/TokenGate/index.tsx`, `admin/useAdminSave.ts`, `admin/useEditorData.ts`, `admin/useImageUpload.ts`, `admin/useSessionCheck.ts`
  - `imageCompress.ts` → `admin/useImageUpload.ts`
  - `navConfig.ts` → `admin/AdminSidebar/index.tsx`
  - `pat.ts` → `admin/AdminAuthContext/index.tsx`
  - `registry.ts` → `pages/Admin/index.tsx`

- [ ] Task 14: Создать `app/src/admin/components/` и перенести туда `AdminLayout/`, `AdminSidebar/`, `AdminAuthContext/`, `AdminLocaleContext/` (вместе с `AdminLocaleContext.test.tsx`), `TokenGate/`, `LocalizedField/`, `TaxonomyCheckboxes/` (вместе с `TaxonomyCheckboxes.test.tsx`), `ImageUploadField/`, `GalleryUploadField/`, `RichTextEditor/`. Обновить импорты `@/admin/<Component>` → `@/admin/components/<Component>` во всех потребителях:
  - `AdminLayout` → `pages/Admin/index.tsx`
  - `AdminSidebar` → `admin/components/AdminLayout/index.tsx` (после переноса)
  - `AdminAuthContext` → `admin/components/AdminLayout/index.tsx`, `admin/editors/ProjectForm/index.tsx`, `admin/editors/ProjectsList/index.tsx`, `admin/editors/TaxonomyEditor/index.tsx`, `admin/components/TokenGate/index.tsx`, `admin/hooks/useAdminSave.ts`, `admin/hooks/useEditorData.ts`, `admin/hooks/useImageUpload.ts` (три последних — плейсхолдер путь, файлы физически ещё в `admin/` до Task 15, но алиас-путь к `AdminAuthContext` в них обновляется уже здесь), `pages/Admin/index.tsx`
  - `AdminLocaleContext` → `admin/components/AdminLayout/index.tsx`, `admin/components/AdminLocaleContext/AdminLocaleContext.test.tsx`, `admin/editors/ProjectForm/index.tsx`, `admin/editors/ProjectsList/index.tsx`, `admin/components/LocalizedField/index.tsx`, `pages/Admin/index.tsx`
  - `TokenGate` → `admin/components/AdminLayout/index.tsx`
  - `LocalizedField` → `admin/editors/ProfileEditor/index.tsx`, `admin/editors/ProjectForm/index.tsx`
  - `TaxonomyCheckboxes` → `admin/editors/ProjectForm/index.tsx`, `admin/components/TaxonomyCheckboxes/TaxonomyCheckboxes.test.tsx`
  - `ImageUploadField` → `admin/editors/ProfileEditor/index.tsx`, `admin/editors/ProjectForm/index.tsx`, `admin/components/GalleryUploadField/index.tsx`
  - `GalleryUploadField` → `admin/editors/ProjectForm/index.tsx`
  - `RichTextEditor` → `admin/components/LocalizedField/index.tsx`
  (depends on 13)
<!-- Commit checkpoint: tasks 13-14 -->

- [ ] Task 15: Создать `app/src/admin/hooks/` и перенести туда `useAdminSave.ts`, `useEditorData.ts`, `useImageUpload.ts`, `useSessionCheck.ts`. Обновить импорты `@/admin/<hook>` → `@/admin/hooks/<hook>` во всех потребителях:
  - `useAdminSave` (включая `useAdminOperation`) → `admin/editors/ProfileEditor/index.tsx`, `admin/editors/ProjectForm/index.tsx`, `admin/editors/ProjectsList/index.tsx`, `admin/editors/SkillsEditor/index.tsx`, `admin/editors/TaxonomyEditor/index.tsx`
  - `useEditorData` → `admin/editors/ProfileEditor/index.tsx`, `admin/editors/ProjectForm/index.tsx`, `admin/editors/SkillsEditor/index.tsx`, `admin/editors/TaxonomyEditor/index.tsx`
  - `useImageUpload` → `admin/components/ImageUploadField/index.tsx`
  - `useSessionCheck` → `admin/components/AdminLayout/index.tsx`
  (depends on 14)
<!-- Commit checkpoint: task 15 -->

### Phase 8: Верификация и документация (амендмент)

- [ ] Task 16: Прогнать `npm run build` и `npm run test` в `app/`, убедиться что все алиасные импорты на `admin/lib/*`, `admin/components/*`, `admin/hooks/*` и плоский `App.tsx` резолвятся корректно, ничего не сломано (depends on 15)
- [ ] Task 17: Обновить `.ai-factory/ARCHITECTURE.md`, `.ai-factory/DESCRIPTION.md` и `AGENTS.md` под новую структуру `admin/` (`components/`/`hooks/`/`lib/`, зеркалирующую верхний уровень `src/`) и исключение плоского `App.tsx` из конвенции «компонент = папка» (depends on 16)
<!-- Commit checkpoint: tasks 16-17 -->
