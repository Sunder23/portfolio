# Админка в стиле WordPress: структура, языковой контекст, авто-slug, WYSIWYG, per-file проекты, таксономии

**Branch:** `feature/admin-wordpress-ux`
**Создан:** 2026-07-18

## Settings

- **Testing:** да — тесты для ключевой логики (генерация slug, per-project CRUD в `admin/github.ts`, `AdminLocaleContext`, `TaxonomyCheckboxes`). Инфраструктура тестов (Vitest) в проекте пока не настроена — добавляется первым делом (см. задачи).
- **Logging:** verbose — подробные `console.info`/`console.error` в новом коде, в стиле уже принятом в `admin/github.ts` и `admin/useAdminSave.ts` (`[admin/<module>] <событие>`).
- **Docs:** да — обязательный чекпойнт `/aif-docs` в конце (обновление `ARCHITECTURE.md` и `DESCRIPTION.md`).

## Roadmap Linkage

- **Milestone:** "Этап 6 — Админка в стиле WordPress" (добавлен в `.ai-factory/ROADMAP.md`)
- **Rationale:** все прежние этапы roadmap, кроме Лидов, уже закрыты; эта доработка — новый скоуп, не описанный ранее, поэтому оформлена отдельным майлстоуном, а не довеском к "Этап 5 — Полировка".

## Контекст и текущее состояние

Публичная часть и админка живут в `app/`, единственный источник данных — JSON в `app/data/`, запись из админки — коммит через GitHub Contents API (`admin/github.ts`). Сейчас:

- Админка — плоский список редакторов (`admin/registry.ts` → `editorRegistry`), без иерархии меню.
- Единый глобальный language-context есть только в публичной части (`hooks/useLocale.ts` + hash-роут); в админке `LocalizedField` держит per-field вкладку `uk/ru/en` независимо друг от друга, глобального переключателя нет.
- `slug` проекта — обычный текстовый Input, вводится руками (наравне с `id`, который дублирует его же).
- Markdown-поля (`description`, `bio`) редактируются как textarea + read-only превью через `marked` (`admin/MarkdownPreview.tsx`).
- Все проекты хранятся одним массивом в `app/data/projects.json`; любое сохранение = перезапись всего файла с одним `sha`.
- `stack` — строка через запятую; `role` — свободный текст; категорий/типа проекта нет вообще.

## Целевой дизайн

### 1. WordPress-подобная структура

Верхний admin-bar (ссылка на паблик-сайт, переключатель языка контента, кнопка "Выйти") + левый сайдбар с раскрывающимися группами (по образцу *Posts → All Posts / Add New / Categories / Tags*):

- **Projects** → All Projects (`/admin/projects`), Add New (`/admin/projects/new`), Tech Stack (`/admin/taxonomies/stack`), Categories (`/admin/taxonomies/category`), Roles (`/admin/taxonomies/role`)
- **Profile** → `/admin/profile` (без подменю, как WP *Settings*)
- **Skills** → `/admin/skills` (без подменю)

Реализуется через `admin/navConfig.ts` — новую точку расширения вместо плоского `editorRegistry`, в духе принципа архитектуры "новая сущность = запись в реестре, а не ветвление кода".

### 2. Глобальный языковой контекст админки

Новый `AdminLocaleContext` (persisted в `localStorage`, ключ `portfolio-admin-locale`, дефолт `uk`), полностью отдельный от публичного `useLocale` (админка не импортирует паблик-модули — только тип `Locale`). Переключатель в top-bar. `LocalizedField` подписывается на контекст и переkey активную вкладку при смене языка в top-bar (пользователь всё ещё может локально переключить вкладку одного поля, не трогая глобальный контекст — так же ведёт себя переключатель языка интерфейса в самом WordPress).

### 3. Авто-slug из заголовка

Ручное поле slug убирается. Новый `lib/slug.ts` транслитерирует укр./рос. кириллицу в латиницу (заголовки — кириллические) и генерирует slug из `title[адрес-локали админки] || title.uk`, с дедупликацией (`-2`, `-3`, …) против уже существующих файлов. UI: превью сгенерированного slug с иконкой-карандашом для ручной правки (после ручной правки автогенерация для этого поля останавливается) — как permalink-box в WordPress.

Заодно убирается отдельное поле `id` (Project) — оно дублировало `slug` и тоже вводилось руками; уникальным идентификатором становится сам `slug` (и имя файла).

### 4. Визуальный редактор markdown-полей

Выбран **TipTap WYSIWYG + `tiptap-markdown`**: полноценный редактор с тулбаром (bold/italic/H1/H2/списки/ссылка), но сериализующий содержимое обратно в markdown-строку — формат данных в JSON не меняется, только UX редактирования. Заменяет связку textarea + `MarkdownPreview` (компонент удаляется).

### 5. Проекты как отдельные файлы

`app/data/projects.json` (один массив) → `app/data/projects/{slug}.json` (один файл = один проект). `lib/data.ts` читает папку через `import.meta.glob` (build-time, статика для GitHub Pages не ломается). `admin/github.ts` получает `listDir`/`createFile`/`deleteFile` в дополнение к существующим `getFile`/`putFile`/`saveFile`, чтобы работать с директорией и отдельными файлами (создание, переименование при смене slug = create нового + delete старого, удаление).

### 6. Таксономии

`app/data/taxonomies.json` — три управляемых словаря: `stack`, `category` (новое поле у Project), `role`. Экран `/admin/taxonomies/:key` (обобщённый `TaxonomyEditor`) — добавление/переименование/удаление термина, с предупреждением при удалении термина, который используется в проектах (без каскадного авто-обновления проектов — как в WordPress термин не переезжает на записи автоматически). В форме проекта: `stack`/`category` — чекбоксы (`TaxonomyCheckboxes`), `role` — одиночный select. Ручной ввод текста для этих полей больше не нужен.

## Осознанные ограничения v1

- Удаление таксономического термина не каскадно правит уже сохранённые проекты — только предупреждает о количестве использований.
- Переименование slug проекта = 2 запроса к Contents API (create + delete); нет транзакционности на уровне GitHub API, поэтому create выполняется первым (в худшем случае при сбое второго запроса останутся оба файла, а не ни одного).

## Tasks

Полный список с зависимостями — в TaskList (19 задач, id 1–19). Кратко по фазам:

**Фаза 1 — данные и утилиты**
1. [x] `lib/slug.ts` (транслитерация + дедупликация) + тесты
2. [x] Vitest + RTL инфраструктура
3. [x] `types.ts`: `Taxonomies`, `Project.category`, удаление `Project.id`, `resolveLocalized`
4. [x] `app/data/taxonomies.json` (seed)
5. [x] Миграция `projects.json` → `app/data/projects/{slug}.json`
6. [x] `lib/data.ts` → чтение папки через `import.meta.glob`
7. [x] `admin/github.ts`: `listDir`/`createFile`/`deleteFile` + тесты

**Фаза 2 — языковой контекст и WP-оболочка**
8. [x] `AdminLocaleContext` + `useAdminLocalized` + тесты
9. shadcn: checkbox/select/collapsible/dropdown-menu/separator
10. `admin/navConfig.ts`
11. `AdminLayout.tsx` — top-bar + collapsible-сайдбар
12. `Admin.tsx` — новое дерево роутов

**Фаза 3 — таксономии**
13. `TaxonomyCheckboxes` + тесты
14. `TaxonomyEditor.tsx` (обобщённый менеджер терминов)

**Фаза 4 — редактирование контента**
15. `LocalizedField` — дефолтная вкладка из admin-locale + `richText`-вариант
16. `RichTextEditor.tsx` (TipTap + `tiptap-markdown`), удаление `MarkdownPreview.tsx`

**Фаза 5 — Projects CRUD**
17. Полный рерайт `ProjectsEditor.tsx` (list/new/:slug, авто-slug, чекбоксы таксономий, rich text, per-file CRUD)

**Фаза 6 — проверка и документация**
18. Ручная проверка в браузере (полный сценарий: логин → создание/переименование/удаление проекта → таксономии → смена языка)
19. `/aif-docs` чекпойнт: `ARCHITECTURE.md` + `DESCRIPTION.md`

## Commit Plan

С учётом 19 задач — чекпоинты примерно каждые 3–5 задач:

1. `feat(data): add slug utility, taxonomies type/seed, per-project files, test infra` (задачи 1–6)
2. `feat(admin): add directory-based github.ts CRUD and admin locale context` (задачи 7–8)
3. `feat(admin): wordpress-style layout, nav config, routing` (задачи 9–12)
4. `feat(admin): taxonomy management UI` (задачи 13–14)
5. `feat(admin): rich text editor and locale-aware localized fields` (задачи 15–16)
6. `feat(admin): rewrite projects editor with per-file CRUD, auto-slug, taxonomies` (задача 17)
7. `docs: update architecture for new admin/data structure` (задача 19, после ручной проверки 18)

## Следующий шаг

```
/aif-implement
```
