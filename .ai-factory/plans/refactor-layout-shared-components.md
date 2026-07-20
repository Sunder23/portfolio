# Refactor: `shared/` для частей layout-root'ов

**Branch:** `refactor/layout-shared-components`
**Создан:** 2026-07-20

## Контекст

Сейчас `ARCHITECTURE.md` описывает асимметричное решение:
- Публичная часть: `Nav/`, `Footer/`, `Scanline/` — плоско в `components/` (исключение №1 из правила "1 потребитель → к потребителю").
- Admin: `AdminSidebar/`, `TokenGate/`, `SaveAllButton/` — строго вложены внутрь `admin/layouts/` (папки самого `AdminLayout`), без симметричного исключения.

Решено унифицировать оба случая через новую директорию `shared/` (сосед `components/` и `layouts/`) и `admin/shared/` (сосед `admin/components/` и `admin/layouts/`): это компоненты, у которых единственный потребитель — сам layout-root, но которые не являются ни "реально переиспользуемыми" (не место в `components/`), ни внутренней деталью реализации одного файла (не обязаны быть вложены в него).

## Settings

- **Тесты:** да — существующие колокейтед-тесты (`Footer.test.tsx`, `ProjectForm.test.tsx`, `ProjectsList.test.tsx`) переезжают вместе с компонентами (где применимо) и должны проходить после переноса; новых тестов не добавляется.
- **Логирование:** н/п — чистый перенос файлов и правка путей импорта, новой рантайм-логики нет.
- **Документация:** да — обязательный чекпоint, `ARCHITECTURE.md` обновляется как часть этого плана (см. задачу 4).
- **Roadmap linkage:** нет — чисто внутренний рефакторинг структуры, не привязан ни к одному этапу `ROADMAP.md`.

## Целевая структура

```
app/src/
├── layouts/
│   └── PublicLayout/
├── shared/                    # НОВОЕ: единственный потребитель — свой layout-root
│   ├── Nav/                     # + ThemeToggle/ вложен (как и раньше)
│   ├── Footer/
│   └── Scanline/
├── components/                # без изменений — реально переиспользуемые (2+ потребителя)
│   └── ui/
├── admin/
│   ├── layouts/
│   │   └── index.tsx            # AdminLayout, импортирует из ../shared/*
│   ├── shared/                  # НОВОЕ: единственный потребитель — AdminLayout
│   │   ├── AdminSidebar/
│   │   ├── TokenGate/
│   │   └── SaveAllButton/
│   └── components/              # без изменений
```

## Разведка импортов (сделана заранее)

Все 6 компонентов импортируются только через alias `@/...` (кроме 3 импортов внутри `admin/layouts/index.tsx`, которые сейчас относительные `./X`). Внутри самих перемещаемых компонентов относительных импортов `../` нет (кроме `Nav/index.tsx` → `./ThemeToggle`, который переезжает вместе с `Nav/` и не ломается).

Файлы, которые нужно поправить после переноса:
1. `layouts/PublicLayout/index.tsx` — 3 импорта (`@/components/Nav`, `@/components/Footer`, `@/components/Scanline` → `@/shared/*`)
2. `components/Footer/Footer.test.tsx` (после переноса — `shared/Footer/Footer.test.tsx`) — собственный self-import `@/components/Footer` → `@/shared/Footer`
3. `admin/layouts/index.tsx` — 3 относительных импорта (`./TokenGate`, `./AdminSidebar`, `./SaveAllButton` → `../shared/*`)
4. `admin/editors/ProjectForm/ProjectForm.test.tsx` — `@/admin/layouts/SaveAllButton` → `@/admin/shared/SaveAllButton`
5. `admin/editors/ProjectsList/ProjectsList.test.tsx` — `@/admin/layouts/SaveAllButton` → `@/admin/shared/SaveAllButton`

Конфиги (`vite.config.ts`, `tsconfig*.json`, `components.json`) трогать не нужно — они определяют только корень алиаса `@/*` → `./src/*`.

## Tasks

### [x] 1. Перенос публичных shared-компонентов (`components/*` → `shared/*`)
`git mv` для `Footer/`, `Nav/` (с вложенным `ThemeToggle/`), `Scanline/`. Правка импортов в `layouts/PublicLayout/index.tsx` (3 шт.) и self-import в `shared/Footer/Footer.test.tsx`.

### [x] 2. Перенос детей AdminLayout (`admin/layouts/* → admin/shared/*`)
`git mv` для `AdminSidebar/`, `TokenGate/`, `SaveAllButton/`. Правка 3 относительных импортов в `admin/layouts/index.tsx` и alias-импортов в `ProjectForm.test.tsx` / `ProjectsList.test.tsx`.

*(blocked by: —, независима от задачи 1)*

### [x] 3. Проверка сборки, типов и тестов

`tsc -b && vite build` — успех. `vitest run` — 95/96, единственный сбой (`Footer.test.tsx`, `Cannot destructure property 'basename'`) подтверждён как pre-existing (воспроизводится и на исходном коде до переноса через `git stash`), к переносу не относится, вне скоупа этого рефакторинга. Grep на старые пути (`@/components/Footer`, `@/components/Nav`, `@/components/Scanline`, `@/admin/layouts/{SaveAllButton,AdminSidebar,TokenGate}`) — 0 совпадений.
`npm run typecheck` (или `tsc --noEmit`), `npm test` (vitest), `npm run build` из `app/`. Grep на остатки старых путей (`@/components/Footer`, `@/components/Nav`, `@/components/Scanline`, `@/admin/layouts/SaveAllButton`, `@/admin/layouts/AdminSidebar`, `@/admin/layouts/TokenGate`) — должно быть 0 совпадений.

*(blocked by: 1, 2)*

### [x] 4. Обновление `ARCHITECTURE.md`
- Обновить дерево структуры папок (текущие строки ~19-95): добавить `shared/` рядом с `layouts/`/`components/` и `admin/shared/` рядом с `admin/layouts/`/`admin/components/`.
- Переписать секцию "Колокейт компонентов" (текущие строки ~115-139): убрать Исключение №1 (Nav/Footer/Scanline плоско в components/) и абзац про намеренную асимметрию admin-эквивалента; заменить единым правилом про `shared/`/`admin/shared/`.
- Проверить секцию "Правила зависимостей" на упоминания `components/`, которые теперь стоит дополнить `shared/`.

*(blocked by: 3)*

## Commit Plan

Один общий коммит в конце (4 задачи, но логически это один атомарный рефакторинг структуры + доки):

```
refactor(structure): move layout-root children into shared/ and admin/shared/
```
