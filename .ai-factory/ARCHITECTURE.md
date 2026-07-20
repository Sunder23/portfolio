# Архитектура: Modular Monolith (frontend-адаптация)

## Обзор

Проект — чистый фронтенд без сервера и без БД: React 19 + Vite + TypeScript,
собирается в статику и деплоится на GitHub Pages. Единственный источник
данных — JSON-файлы в `/data/`, редактируемые либо вручную, либо через
встроенную админку (коммит через GitHub Contents API). Модульный монолит
здесь означает: одно приложение, один деплой, но два строго разделённых
модуля — **публичная часть** и **admin** — с общим слоем доступа к данным,
через который проходит вся работа с JSON вместо БД.

## Обоснование выбора

- **Тип проекта:** статичный сайт-портфолио с браузерной админкой, соло-разработчик.
- **Стек:** React 19 + Vite + TypeScript, без бэкенда.
- **Ключевой фактор:** нет домена настолько сложного, чтобы оправдать Clean Architecture/DDD, и нет отдельных сервисов для микросервисов. Но есть два явно разных потребителя одних и тех же данных (публичная часть — только чтение, админка — чтение+запись), поэтому важна единая, не дублированная точка доступа к данным — это и есть модульная граница.

## Структура папок

```
app/src/
├── App.tsx                   # корневой компонент, рендерится из main.tsx — единственное
│                               # намеренное исключение из конвенции "компонент = папка"
│                               # (entry-компонент без колокейтед-теста, папка ради одного файла избыточна)
├── pages/                    # Публичный модуль: Home/ (12 колокейтед секций-компонентов,
│   │                           см. "Колокейт компонентов" ниже), Projects/ (+ ProjectFilters/
│   │                           вложен), ProjectDetail/, About/, Contact/, NotFound/ (catch-all
│   │                           внутри каждого per-locale роута, см. App.tsx)
│   └── Admin/                  # (роут /#/admin) — отдельная точка входа, см. admin/
├── layouts/                   # Layout-root компонент публичной части (PublicLayout/) — сосед
│   │                           shared/ и components/, не вложен внутрь них; симметричный
│   │                           admin-эквивалент — admin/layouts/ (см. ниже)
├── shared/                    # Части layout-root'а: единственный потребитель каждого — сам
│   │                           PublicLayout, но это не переиспользуемые UI-компоненты (не место
│   │                           в components/) — см. "Колокейт компонентов" ниже
│   ├── Nav/                     # + ThemeToggle/ вложен (единственный потребитель — Nav)
│   ├── Footer/
│   └── Scanline/
├── components/                # Реально shared UI-компоненты публичной части (2+ потребителя)
│   └── ui/                     # shadcn/ui — плоские файлы, исключены из конвенции папка-на-компонент.
│                                 Также содержит heading.tsx (Heading, level 1-6) — единственная
│                                 ручная (не сгенерированная shadcn CLI) добавка сюда, намеренно:
│                                 это единственная общая точка, доступная и pages/*, и admin/* (см.
│                                 "Правила зависимостей" ниже)
├── hooks/
│   ├── useAsyncData.ts         # общий "fetch once on mount" хук для публичных страниц
│   ├── useDocumentMeta.ts      # управление <title>/meta/OG-тегами
│   ├── useLocale.ts             # содержит createContext, но остаётся здесь — осознанное
│   │                             исключение из правила "createContext → context/" (см. ниже),
│   │                             10 строк без единой строки JSX, слишком тривиален для context/
│   └── useLocalized.ts
├── admin/                     # Admin-модуль — самодостаточный, не импортируется публичной частью.
│   │                            Сгруппирован по типу, зеркалируя верхний уровень src/
│   ├── context/                 # Любой файл с createContext — независимо от числа потребителей
│   │   ├── AdminAuthContext/      # сессия/PAT (setToken/logout)
│   │   ├── AdminLocaleContext/    # глобальный языковой контекст админки (переключатель в top-bar)
│   │   └── AdminDraftContext/     # глобальный staging-стор (черновики правок за сессию, keyed by
│   │                                путь к файлу) — по факту полноценный стор, но имя не меняется
│   │                                на AdminDraftStore ради консистентности с Context API
│   ├── layouts/                 # Layout-root: AdminLayout (top-bar + <AdminSidebar/> +
│   │   │                           <AdminDraftProvider><Outlet/></AdminDraftProvider> + <SaveAllButton/>),
│   │   │                           сосед admin/shared/ и admin/components/ — симметрично
│   │   │                           src/layouts/ (PublicLayout)
│   ├── shared/                  # Части AdminLayout — единственный потребитель каждого —
│   │   │                           AdminLayout, симметрично src/shared/ (см. "Колокейт
│   │   │                           компонентов" ниже)
│   │   ├── AdminSidebar/          # рендер дерева сайдбара из lib/navConfig.ts
│   │   ├── TokenGate/
│   │   └── SaveAllButton/
│   ├── components/              # Компоненты админки, которые НЕ определяют createContext и не
│   │   │                           являются layout-root
│   │   ├── LocalizedField/        # обёртка uk/ru/en-табов для локализуемых полей форм
│   │   │   └── RichTextEditor/      # WYSIWYG (TipTap), единственный потребитель — LocalizedField
│   │   └── ImageUploadField/      # локальная компрессия + отложенная загрузка (PendingImage)
│   │                                одиночного изображения — реально shared (2+ потребителя:
│   │                                GalleryUploadField и ProfileEditor), остаётся здесь
│   ├── hooks/                   # Все хуки админки
│   │   ├── useSessionCheck.ts     # хук проверки валидности PAT-сессии
│   │   ├── useEditorData.ts       # общий "load one JSON, stage in AdminDraftContext, auto-register default flush" хук для редакторов-одиночек
│   │   └── useAdminSave.ts        # ACTIONS_URL (ссылка на GitHub Actions в тосте "Сохранено") + useAdminOperation/useAdminSave — общая логика мгновенного сохранения с обработкой ошибок; ни один редактор сейчас её не вызывает (create/delete/rename проектов и правки Taxonomies идут батчем через AdminDraftContext), кандидат на удаление, если не появится сценарий, которому батчинг не подходит
│   ├── lib/                      # Чистые модули без JSX
│   │   ├── github.ts              # единственный клиент записи в репозиторий (Contents API),
│   │   │                           включая per-file операции (listDir/createFile/deleteFile) и uploadPendingImage()
│   │   ├── resolvePendingImages.ts # generic-резолвер PendingImage {blob, previewUrl} -> загруженный путь, не завязан на схему сущности
│   │   ├── navConfig.ts           # дерево сайдбара админки — точка расширения на новые разделы меню
│   │   ├── registry.ts            # реестр редакторов-одиночек (Profile, Skills) — точка расширения
│   │   ├── pat.ts                 # чтение/запись PAT в localStorage
│   │   └── imageCompress.ts       # сжатие изображения в webp (canvas), выполняется локально при выборе файла (без сети)
│   └── editors/
│       ├── ProfileEditor/, SkillsEditor/, TaxonomyEditor/  # редакторы-одиночки
│       ├── ProjectsList/, ProjectForm/                      # Projects: список и форма — раздельные компоненты
│       │   ├── TaxonomyCheckboxes/                            # чекбоксы для полей-таксономий (stack/category),
│       │   └── GalleryUploadField/                            # компрессия + отложенная загрузка галереи —
│       │                                                        оба вложены, единственный потребитель ProjectForm
│       └── projectsData.ts                                  # data-хелперы Projects (не компонент, плоский файл)
├── lib/
│   ├── data.ts                  # единственная точка чтения data/*.json и data/projects/*.json
│   └── slug.ts                  # авто-генерация slug из заголовка (кириллица → латиница)
├── locales/                   # словари react-i18next (uk, ru, en)
└── types.ts                   # общие типы, включая Localized<T> и Taxonomies
```

### Конвенция: компонент = папка

Каждый `.tsx`-файл, экспортирующий React-компонент с JSX (включая context-провайдеры),
живёт в собственной папке `ComponentName/index.tsx`. Благодаря алиасу `@/*` → `./src`
импорт вида `@/admin/context/AdminAuthContext` разрешается в `AdminAuthContext/index.tsx`
автоматически — переезд файла в папку не требует правки импортов у потребителей. Колокейтед тест —
`ComponentName/ComponentName.test.tsx` (не `index.test.tsx`, чтобы имя было видно во
вкладках редактора и в выводе test-раннера). Хуки (`useX.ts`) и чистые модули без JSX
(`github.ts`, `slug.ts`, `navConfig.ts`, `registry.ts`, `projectsData.ts`) остаются
плоскими файлами — это не компоненты. **Исключение:** `components/ui/*` — это shadcn/ui
примитивы, `components.json` (`aliases.ui: "@/components/ui"`) ожидает их плоскими, так
работает `npx shadcn add`/`diff`; перенос в папки сломал бы штатное обновление через CLI.
`heading.tsx` — единственный файл в `components/ui/` не из shadcn CLI (ручной `Heading`-примитив,
`level` 1-6), но остаётся плоским по той же конвенции и не мешает `shadcn diff` (CLI трогает только
свои сгенерированные файлы).
**Единственное исключение из другого рода** — корневой `App.tsx`: это entry-компонент без
колокейтед-теста, папка ради одного файла избыточна, поэтому он остаётся плоским.

### Колокейт компонентов: 1 потребитель → к потребителю, 2+ → components/, дети layout-root'а → shared/

- **Правило:** компонент с ровно одним потребителем переезжает в папку этого потребителя
  (`pages/Home/HeroSection/TerminalCursor/`, `admin/editors/ProjectForm/TaxonomyCheckboxes/` и
  т.д.); компонент с 2+ реальными потребителями остаётся в `components/` / `admin/components/`
  как действительно переиспользуемый. Применяется строго, кроме одного класса исключений ниже.
- **Исключение (дети layout-root'а):** компоненты, единственный потребитель которых — сам
  layout-root страницы (`PublicLayout`, `AdminLayout`), не колокейтятся внутрь layout-root'а и
  не смешиваются с `components/` / `admin/components/` (зарезервированы для действительно
  переиспользуемых, 2+-потребительских компонентов) — вместо этого живут в соседней папке
  `shared/` / `admin/shared/`:
  - публичная часть: `shared/Nav/` (+ вложенный `ThemeToggle/`, единственный потребитель —
    сам `Nav`), `shared/Footer/`, `shared/Scanline/` — потребляются из
    `layouts/PublicLayout/index.tsx`;
  - admin: `admin/shared/AdminSidebar/`, `admin/shared/TokenGate/`, `admin/shared/SaveAllButton/`
    — потребляются из `admin/layouts/index.tsx` (`AdminLayout`).

  Оба случая симметричны: `layouts/` соседствует с `shared/` и `components/`; `admin/layouts/`
  соседствует с `admin/shared/` и `admin/components/`. `AdminLayout` сам — layout-root (аналог
  `PublicLayout`), единственный потребитель `pages/Admin/index.tsx` по определению одного роута,
  но не колокейтится внутрь `pages/Admin/` — по той же логике, что и `PublicLayout` в `layouts/`.
- **Исключение (тривиальность):** `hooks/useLocale.ts` содержит `createContext`, но не
  переезжает в `context/` (правило ниже) — 10 строк без единой строки JSX, папка была бы
  избыточна.
- **Контексты — отдельное правило:** любой файл с `createContext` живёт в своей папке
  `context/` / `admin/context/`, независимо от числа потребителей (у контекстов по природе
  много потребителей через `useContext`, правило "1 потребитель" сюда неприменимо) — кроме
  исключения (тривиальность) выше.

`app/data/*.json`, `app/data/projects/*.json` и `app/public/uploads/`
физически лежат вне `app/src/` (но внутри `app/`, не в истинном корне репо —
там только dev/AI-tooling, см. `AGENTS.md`) — это "база данных" проекта; к
ней есть ровно два входа: `lib/data.ts` (чтение, используется и публичной
частью, и админкой) и `admin/lib/github.ts` (запись, используется только
админкой). Относительная глубина между `src/` и `data/` не изменилась при
переносе в `app/`, поэтому импорты вида `../../data/projects/*.json` из
`lib/data.ts` остаются корректны без правок.

Проекты хранятся не одним массивом (`projects.json`), а по одному файлу на
проект — `data/projects/{slug}.json`, где `{slug}` совпадает с полем `slug`
внутри файла и одновременно служит его уникальным идентификатором (отдельного
поля `id` у `Project` нет). Это даёт независимый `sha` на каждый проект в
Contents API вместо одного общего `sha` на весь список, поэтому создание,
переименование (смена slug) и удаление одного проекта не конфликтуют с
параллельной правкой другого. `lib/data.ts` собирает список проектов через
`import.meta.glob('../../data/projects/*.json', { eager: true })` — статика
GitHub Pages не страдает, список файлов известен на этапе сборки.

## Правила зависимостей

- ✅ `pages/*` (публичные) → `components/`, `lib/data.ts`, `locales/`
- ✅ `admin/*` → `components/ui`, `lib/data.ts` (чтение), `admin/lib/github.ts` (запись), `types.ts`
- ✅ `admin/editors/*` → регистрируются в `admin/lib/registry.ts` (редакторы-одиночки) или в роутах `pages/Admin.tsx` (сущности со списком/CRUD и с параметром вроде `:key`/`:slug`); друг на друга editors не ссылаются
- ❌ `pages/*` (публичные) НЕ импортируют ничего из `admin/` — админка не должна попадать в публичный бандл иначе, чем как отдельный ленивый роут
- ❌ Компоненты публичной части и `admin/editors/*` не делают собственных fetch/GET к GitHub API напрямую — только через `lib/data.ts` / `admin/lib/github.ts`
- ❌ Ничего, кроме `admin/lib/github.ts`, не формирует PUT-запросы к GitHub Contents API

## Взаимодействие модулей

- Публичная часть и админка взаимодействуют только через данные (`data/*.json`, `data/projects/*.json`), не напрямую через код — это и есть граница модуля, как в классическом modular monolith, где обычно используется shared DB/API, а здесь — общий JSON + общий `lib/data.ts`.
- Локаль — сквозной cross-cutting concern в обеих частях, но с двумя независимыми контекстами: HashRouter передаёт локаль в публичную часть через `hooks/useLocale.ts` (см. `portfolio-i18n-content`); в админке — отдельный `admin/context/AdminLocaleContext/index.tsx` с переключателем в top-bar (не читается и не пишется публичной частью, персистится под другим ключом `localStorage`). Оба используют одну и ту же pure-функцию фолбэка `resolveLocalized()` из `types.ts`.
- Новая сущность контента добавляется без изменения общего кода: JSON-файл (или папка per-item файлов) в `data/` + тип в `types.ts` + редактор в `admin/editors/` + запись в `admin/lib/registry.ts` (для редакторов-одиночек) или в `admin/lib/navConfig.ts` (для пунктов сайдбара с собственным списком/CRUD, как Projects). `lib/data.ts` и `admin/lib/github.ts` уже дженерик по пути к файлу/папке.
- Таксономии (`data/taxonomies.json`: `stack`, `category`, `role`) — управляемые словари для полей-чекбоксов/select в формах контента, редактируются через обобщённый `admin/editors/TaxonomyEditor.tsx` (один компонент на все три таксономии, параметризован ключом из `:key` роута). Удаление термина не каскадно правит уже сохранённые записи — только предупреждает о количестве использований.

## Ключевые принципы

1. **Один вход на чтение, один на запись.** Ни один компонент не читает `data/*.json` напрямую и не делает свой fetch к GitHub API — всё идёт через `lib/data.ts` (чтение) или `admin/lib/github.ts` (запись).
2. **Admin — изолируемый модуль.** Ссылок на `/#/admin` из публичной части нет; в идеале роут админки грузится лениво (`React.lazy`), чтобы не раздувать бандл публичной части.
3. **Расширение через реестр, не через ветвление кода.** Новая сущность контента — это запись в `admin/lib/registry.ts` или `admin/lib/navConfig.ts`, а не `if`/`switch` в существующих компонентах.

## Примеры кода

### Единая точка чтения данных (`lib/data.ts`)

```ts
// lib/data.ts
import type { Project, Profile } from '../types';

const projectModules = import.meta.glob<{ default: Project }>('../../data/projects/*.json', { eager: true });

export async function getProjects(): Promise<Project[]> {
  return Object.values(projectModules).map((m) => m.default);
}

export async function getProfile(): Promise<Profile> {
  const data = await import('../../data/profile.json');
  return data.default;
}
```

Публичная страница использует только эту точку входа:

```tsx
// pages/Projects.tsx
import { getProjects } from '../lib/data';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => { getProjects().then(setProjects); }, []);
  // ...
}
```

### Реестр редакторов-одиночек (`admin/lib/registry.ts`) и сайдбар (`admin/lib/navConfig.ts`)

```ts
// admin/lib/registry.ts — редакторы без списка/CRUD (один файл = одна сущность)
export const editorRegistry = [
  { id: 'profile', path: 'app/data/profile.json', label: 'Профиль', Editor: ProfileEditor },
  { id: 'skills', path: 'app/data/skills.json', label: 'Скиллы', Editor: SkillsEditor },
] as const;

// admin/lib/navConfig.ts — структура сайдбара (WordPress-style группы с подменю)
export const navConfig: AdminNavItem[] = [
  {
    id: 'projects', label: 'Projects', icon: FolderKanban, path: '/admin/projects',
    children: [
      { label: 'All Projects', path: '/admin/projects' },
      { label: 'Add New', path: '/admin/projects/new' },
      { label: 'Tech Stack', path: '/admin/taxonomies/stack' },
      // ...
    ],
  },
  { id: 'profile', label: 'Profile', icon: UserRound, path: '/admin/profile' },
  // новый раздел меню — просто новая запись здесь
];
```

Ни один `Editor`-компонент не импортирует другой `Editor` — они полностью
независимы и общаются с данными только через `admin/lib/github.ts`. Сущности с
собственным списком/CRUD (сейчас — только Projects) получают отдельные роуты
в `pages/Admin.tsx` (`/admin/projects`, `/admin/projects/new`,
`/admin/projects/:slug`) вместо записи в `editorRegistry`.

## Антипаттерны

- ❌ Компонент публичной части, импортирующий что-то из `admin/` (даже типы — типы должны быть в `types.ts`, доступном обоим модулям).
- ❌ Прямой `fetch('https://api.github.com/...')` внутри компонента формы редактора вместо вызова `admin/lib/github.ts`.
- ❌ Дублирование логики фолбэка локали (`field[locale] ?? field.uk`) в нескольких местах вместо единой `resolveLocalized()` (используется и публичным `useLocalized()`, и админским `useAdminLocalized()`) — см. `portfolio-i18n-content`.
- ❌ Хранение PAT где-либо, кроме `localStorage`, или его логирование/передача в аналитику.
