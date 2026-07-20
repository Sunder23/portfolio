# Контент-блоки для публичных страниц + фильтр Projects

Branch: `feature/content-blocks-and-filter`
Created: 2026-07-20

## Settings

- Testing: yes — Vitest + RTL для новой логики (`projectFilters`, `projectNavigation`, `ProjectFilters`) и существующего покрытия компонентов/хелперов по конвенции `ComponentName/ComponentName.test.tsx`.
- Logging: verbose (по умолчанию) — `console.debug`/`console.info` в новых интерактивных местах (фильтр, admin-редакторы), по образцу уже существующих логов в `Home/index.tsx`, `Footer/index.tsx`, `admin/editors/ProjectForm/index.tsx`.
- Docs: no — warn-only, без обязательного чекпоинта `/aif-docs` (небольшой контентный фиче-набор, README/docs трогать не требуется).

## Roadmap Linkage

Milestone: "Этап 8 — Контент-блоки и фильтр проектов"
Rationale: Новый milestone, кандидатов среди незакрытых пунктов ROADMAP.md нет (единственный незакрытый — «Этап 4 — Лиды», не связан). Формальное добавление в ROADMAP.md — вне зоны ответственности `/aif-plan`; выполнить отдельно через `/aif-roadmap`, указав это название и краткое описание (фильтр Projects + новые блоки на Home/About/Contact/ProjectDetail).

## Анализ текущего состояния (кратко)

- В проекте всего 2 опубликованных проекта (`app/data/projects/*.json`), у обоих `category: []` — таксономия `category` описана в `app/data/taxonomies.json`, но не используется в данных. `ProjectForm` уже умеет редактировать `category` через `TaxonomyCheckboxes` — правок в админке для этого не требуется, только заполнение данных.
- `Projects` (`app/src/pages/Projects/index.tsx`) — просто грид карточек без фильтра/поиска/сортировки.
- `ProjectDetail` — нет навигации между проектами и блока похожих проектов.
- `Home`/`About` — нет CV, отзывов, образования/сертификатов.
- `Contact` — форма без реальной отправки (не блок этого плана — уже отдельный незакрытый пункт «Этап 4 — Лиды» в ROADMAP.md), нет прямых контактов и статуса доступности на самой странице, хотя `contact.successDescription` уже сегодня советует писать на email напрямую.
- Паттерн для новых сущностей контента уже есть и обкатан: `ExperienceEditor` + запись в `admin/lib/registry.ts` + `admin/lib/navConfig.ts` — используется этим планом для Testimonials и Credentials.

## Решения по фильтру Projects

- **Role** — переключатель (`ui/tabs`), поле обязательное и малозначное.
- **Stack** — мультивыбор тегами (chip-кнопки), поле уже богато заполнено.
- **Category** — мультивыбор тегами, требует предварительного заполнения данных (задача 1).
- Опции фильтра выводятся динамически из реально опубликованных проектов, а не из `taxonomies.json` — чтобы никогда не показывать вариант с 0 совпадений.
- Сортировка по году и текстовый поиск — сознательно вне скоупа (не выбраны пользователем), можно добавить позже отдельным пунктом при росте числа проектов.

## Tasks

### Phase A — Данные и новые сущности контента

1. [x] **Заполнить `category` у 2 существующих проектов** — `app/data/projects/portfolio-site.json`, `app/data/projects/realestate-wp-portal.json`.
2. [x] **Поле CV в Profile** — `app/src/types.ts`, `app/data/profile.json`, `app/src/admin/editors/ProfileEditor/index.tsx`.
3. [x] **Сущность Testimonials** — `app/src/types.ts`, `app/data/testimonials.json`, `app/src/lib/data.ts` (`getTestimonials`), `app/src/admin/editors/TestimonialsEditor/index.tsx`, регистрация в `registry.ts`/`navConfig.ts`.
4. [x] **Сущность Credentials (образование/сертификаты)** — аналогично, `app/src/admin/editors/CredentialsEditor/index.tsx`.

### Phase B — Фильтр Projects

5. `app/src/lib/projectFilters.ts` + тесты — чистая функция фильтрации + деривация доступных опций из опубликованных проектов.
6. `app/src/components/ProjectFilters/index.tsx` + тесты — role-tabs, stack/category chips, reset, новые i18n-ключи `projects.filter.*` в uk/ru/en. _blockedBy: 5_
7. Подключение фильтра в `app/src/pages/Projects/index.tsx` — `useSearchParams`, счётчик «показано X из Y», отдельное пустое состояние `projects.emptyFiltered`. _blockedBy: 1, 6_
8. Бейджи role/category на `app/src/components/ProjectCard/index.tsx`. _blockedBy: 1_

### Phase C — ProjectDetail: навигация

9. `app/src/lib/projectNavigation.ts` + тесты — `getAdjacentProjects`, `getRelatedProjects`.
10. Prev/Next + «похожие проекты» в `app/src/pages/ProjectDetail/index.tsx`, новые i18n-ключи. _blockedBy: 9_

### Phase D — Home/About блоки

11. Кнопка «Скачать CV» на `Home` и `About`. _blockedBy: 2_
12. Блок отзывов на `Home` (использует `getTestimonials`). _blockedBy: 3_
13. Блок образования/сертификатов на `About` (использует `getCredentials`). _blockedBy: 4_

### Phase E — Contact

14. Прямые контакты + бейдж доступности на `app/src/pages/Contact/index.tsx`.
15. FAQ-блок на `Contact` (по образцу `home.services.items`).

### Phase F — QA

16. Прогон `npm run test`, ручная проверка всех комбинаций фильтра (включая нулевой результат), prev/next на границах списка, graceful-hide всех новых блоков при пустых данных, проверка uk/ru/en на отсутствующие ключи. _blockedBy: 7, 8, 10, 11, 12, 13, 14, 15_

## Commit Plan

1. После задач 1–4: `feat(data): add category values, CV field, testimonials and credentials entities`
2. После задач 5–8: `feat(projects): add role/stack/category filter to Projects page`
3. После задач 9–10: `feat(project-detail): add prev/next navigation and related projects`
4. После задач 11–13: `feat(home,about): add CV download, testimonials, education/certificates blocks`
5. После задач 14–16: `feat(contact): add direct contact info, availability badge, FAQ; final QA`

## Открытые вопросы для пользователя (не блокируют старт реализации)

- Реальный контент для отзывов (`testimonials.json`) и образования/сертификатов (`credentials.json`) — плейсхолдеры до тех пор, пока не предоставите текст.
- FAQ на Contact — статичный контент через i18n, не редактируется через админку; если нужно редактировать без деплоя кода, потребуется отдельная сущность + admin-редактор (как Testimonials/Credentials) — сообщите, если это важно.
- Файл CV (PDF) — путь редактируется в админке текстовым полем, но сама загрузка файла в `public/uploads/` остаётся ручной (нет compression-пайплайна под PDF, как у изображений).
