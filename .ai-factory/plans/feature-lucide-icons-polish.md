# План: иконки lucide-react по всему проекту

**Ветка:** `feature/lucide-icons-polish`
**Создан:** 2026-07-20

## Настройки

- **Тесты:** нет — чисто визуальные правки JSX (иконка вместо/рядом с текстом или ASCII-декором). Существующие компонентные тесты не должны ломаться, но новых тестов не требуется.
- **Логирование:** минимальное — задача не затрагивает бизнес-логику, поэтому логирование не требуется ни в одной из задач.
- **Документация:** нет обязательного чек-пойнта (warn-only) — README/ARCHITECTURE не меняются по сути.
- **Roadmap linkage:** нет — задача является точечным UI-улучшением (полировка), не отдельной вехой роадмапа (см. `.ai-factory/ROADMAP.md`, все актуальные этапы закрыты кроме Этапа 4 "Лиды", к которому эта задача не относится).

## Контекст / находки ресерча

- `lucide-react@1.24.0` уже установлен и используется в `admin/lib/navConfig.ts` (иконки в сайдбаре админки), а также в `ThemeToggle` (Sun/Moon), `pages/Projects/index.tsx` (ChevronDown), `pages/ProjectDetail/index.tsx` (ChevronLeft/ChevronRight).
- **Важно:** установленная версия lucide-react **не содержит брендовых иконок** (`Github`, `Linkedin` отсутствуют в пакете) — для ссылок на GitHub/LinkedIn использовать обобщённую иконку `Link`, для Telegram — `Send` (похожа на "бумажный самолётик").
- Подход к каждому месту: **иконка + существующий текст рядом** (не полная замена текста на голую иконку) — сохраняет читаемость и доступность.
- Декоративные ASCII-элементы, являющиеся частью терминальной стилистики бренда (`CommandLabel` `$ `, `BracketLabel` `[ ]`, скобки в `shared/Nav`, титул-бар Hero с 3 точками) — **не трогаем**, это осознанный визуальный язык проекта, а не текст, который "надо было бы" заменить на иконку.
- Стиль/размер иконок — на усмотрение по месту (не фиксируем единый size), но stroke-width по умолчанию у lucide-react (2) не переопределяем без причины.

## Задачи (см. также `/tasks` в текущей сессии)

### Фаза 1 — контактные блоки (публичная часть)
1. [x] **Footer** (`shared/Footer/index.tsx`) — иконки `MapPin`/`Mail`/`Send`|`Link` у локации, email и соцсетей.
2. [x] **About** (`pages/About/index.tsx`) — тот же паттерн email/соцсети.
3. [x] **Contact** (`pages/Contact/index.tsx`) — email/соцсети + иконка `Send` на кнопке отправки формы.

### Фаза 2 — секции Home
4. [x] **HeroSection** — иконка `Mail` на кнопке контакта.
5. [x] **CommitsSection** — иконка `GitCommitHorizontal` перед каждым коммитом.
6. [x] **ExperienceSection / FeaturedProjectsSection / ProcessSection** — замена unicode-стрелки `→` на иконку `ArrowRight` (три файла, один паттерн).

*Чекпоинт коммита №1 после задач 1–6* — `feat(ui): add lucide-react icons to contact blocks and home sections`

### Фаза 3 — Projects / ProjectDetail / NotFound
7. [x] **Projects** (`pages/Projects/index.tsx`) — иконка `Filter` на тоггле фильтров, `FilterX`/`Search` в пустых состояниях.
8. [x] **ProjectFilters** — иконка `RotateCcw` на кнопке сброса фильтров.
9. [x] **ProjectDetail** — `ArrowLeft` на ссылке "назад", `Calendar` в строке года, `ExternalLink` на кнопке "перейти на проект".
10. [x] **NotFound** — иконка `Home` на ссылке "на главную".

*Чекпоинт коммита №2 после задач 7–10* — `feat(ui): add lucide-react icons to projects, project detail and 404 pages`

### Фаза 4 — админка (второстепенный приоритет)
11. [x] **ProjectsList** — `Pencil`/`SquarePen` (редактировать), `Trash2` (удалить) на действиях строки.
12. [x] **SaveAllButton** — иконка `Save` на плавающей кнопке "Сохранить всё".
13. [x] **TaxonomyEditor / GalleryUploadField** — `Plus` (добавить), `X`/`Trash2` (удалить) на контролах.

*Чекпоинт коммита №3 после задач 11–13* — `feat(admin): add lucide-react icons to list actions and editor controls`

## Правила зависимостей

- Задачи 1–10 (публичная часть) независимы друг от друга по файлам, порядок — по фазам.
- Задачи 11–13 (админка) идут после задачи 10 (`blockedBy: ["10"]`) — низкий приоритет, выполняются во вторую очередь.

## Commit Plan

| Чекпоинт | Задачи | Сообщение коммита |
|---|---|---|
| 1 | 1–6 | `feat(ui): add lucide-react icons to contact blocks and home sections` |
| 2 | 7–10 | `feat(ui): add lucide-react icons to projects, project detail and 404 pages` |
| 3 | 11–13 | `feat(admin): add lucide-react icons to list actions and editor controls` |

## Следующие шаги

Для начала реализации: `/aif-implement`
