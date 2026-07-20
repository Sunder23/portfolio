# Admin: сайдбар в ProjectForm + ограничение ширины контента

**Ветка:** `feature/admin-layout-sidebar-width`
**Создан:** 2026-07-18

## Настройки

- **Тесты:** нет — визуальная/layout-правка без новой бизнес-логики, ручной проверки в браузере достаточно
- **Логирование:** minimal — новых точек логики нет, дополнительные console.log не требуются
- **Документация:** нет — обязательный чек-пойнт `/aif-docs` не нужен (warn-only), ARCHITECTURE.md/README не описывают конкретную раскладку страниц

## Roadmap Linkage

Milestone: "none"
Rationale: Все milestones в ROADMAP.md либо завершены, либо не относятся к этой задаче (Этап 4 — Лиды, единственный незавершённый, не связан со стилями админки). Это отдельная UI-полировка вне roadmap-уровня.

## Контекст

Референсы в `d:/PetProjects/max_portfolio/screens/`:

- `priarit.working-cases.pp.ua_wp-admin_post.php_post=494&action=edit.png` — эталон WP admin edit-страницы: основной контент + узкий сайдбар справа с блоком "Опубликовать" (кнопка сохранения, статус) и отдельным блоком "Изображение записи".
- `sunder23.github.io_portfolio_*.png` — текущий вид админки этого проекта: все страницы (Tech Stack, Categories, Roles, Profile, Skills, ProjectsList, ProjectForm) растянуты на всю ширину окна (контент в `<main>` без max-width), у ProjectForm нет сайдбара — все поля и кнопки Сохранить/Отмена идут одной колонкой.

## Задачи

### 1. [x] AdminLayout: ограничить ширину контентной области (глобально)

Файл: `app/src/admin/components/AdminLayout/index.tsx`

Обернуть `<Outlet />` в `mx-auto w-full max-w-6xl` контейнер (по аналогии с `PublicLayout` — `max-w-6xl`). Это единая точка, через которую рендерятся все страницы админки, поэтому фикс применяется сразу ко всем: Tech Stack, Categories, Roles, Profile, Skills, All Projects, ProjectForm.

### 2. [x] ProjectForm: WP-подобный сайдбар и двухколоночная раскладка

Файл: `app/src/admin/editors/ProjectForm/index.tsx` (blocked by #1)

- Обёртка `flex flex-col gap-6 lg:flex-row lg:items-start` вокруг основной колонки и сайдбара (стек на узких экранах, две колонки от `lg:`).
- Основная колонка (`flex-1 min-w-0`): title, slug, shortDescription, description, stack, category, role+year, url, gallery — порядок как сейчас.
- Сайдбар (`w-full lg:w-72 lg:shrink-0`), две карточки (`Card`/`CardHeader`/`CardTitle`/`CardContent`):
  - "Публикация": published, order, featured, кнопки Сохранить (primary, `w-full`) / Отмена (outline, `w-full`) — аналог блока "Опубликовать" в WP.
  - "Обложка": `ImageUploadField` для `cover` (перенесён из основной колонки) — аналог блока "Изображение записи" в WP.
- Логика (`update`, `handleSave`, хуки) не меняется — только JSX-структура.

### 3. [x] Ручная проверка в браузере (blocked by #1, #2)

`npm run dev` в `app/`, открыть `/#/admin`:

- Все страницы читаемой ширины, не растянуты на весь экран.
- ProjectForm: сайдбар с двумя карточками виден, соответствует референсу.
- Узкий viewport: сайдбар уходит под контент, ничего не обрезается.
- Save/Cancel в сайдбаре работают как раньше.

## Задачи (добавлены после ревью пользователем на этапе проверки в браузере)

### 4. [x] projectsData: дефолтный role = "WordPress developer"

Файл: `app/src/admin/editors/projectsData.ts` — `emptyProject()`: `role: 'WordPress developer'` вместо `''`.

### 5. [x] LocalizedField: убрать per-field UK/RU/EN табы

Файл: `app/src/admin/components/LocalizedField/index.tsx` — убрать `Tabs`/локальный `active` state, привязать напрямую к `useAdminLocale()`. Затрагивает и ProjectForm, и ProfileEditor (общий компонент).

### 6. [x] ProjectForm: реорганизация полей + year как Select + карточки "Языки"/"Классификация"

- Основная колонка: title, slug, description, shortDescription (под description), url, gallery.
- year → Select (2015–2030, убывание), по паттерну role.
- Сайдбар: Публикация → Языки (UK/RU/EN ссылки, вызывают `setLocale`, без текстового поля) → Классификация (stack, category, role, year) → Обложка.

### 7. [x] TaxonomyEditor: двухколоночная раскладка как в WP edit-tags.php

Референс: `screens/priarit.working-cases.pp.ua_wp-admin_edit-tags.php_taxonomy=category.png`. Форма "Добавить термин" — слева (узкая колонка, Card), список существующих терминов — справа (широкая колонка, Card-строки как сейчас, без таблицы и без eager usage count).

## Commit Plan

Задач больше 5 — коммит в конце после завершения всех 7 задач (например: `style(admin): add project form sidebar, reorganize fields, constrain content width`).
