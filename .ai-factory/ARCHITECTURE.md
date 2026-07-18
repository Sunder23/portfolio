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
├── App/                      # корневой компонент (App/index.tsx), рендерится из main.tsx
├── pages/                    # Публичный модуль: Home/, Projects/, ProjectDetail/, About/, Contact/
│   └── Admin/                  # (роут /#/admin) — отдельная точка входа, см. admin/
├── components/                # Переиспользуемые UI-компоненты публичной части (Name/index.tsx)
│   └── ui/                     # shadcn/ui — плоские файлы, исключены из конвенции папка-на-компонент
├── hooks/
│   ├── useAsyncData.ts         # общий "fetch once on mount" хук для публичных страниц
│   ├── useDocumentMeta.ts      # управление <title>/meta/OG-тегами
│   ├── useLocale.ts
│   └── useLocalized.ts
├── admin/                     # Admin-модуль — самодостаточный, не импортируется публичной частью
│   ├── AdminLayout/             # WP-подобная оболочка: top-bar + <AdminSidebar/> + <Outlet/>
│   ├── AdminSidebar/            # рендер дерева сайдбара из navConfig.ts
│   ├── useSessionCheck.ts       # хук проверки валидности PAT-сессии
│   ├── navConfig.ts             # дерево сайдбара админки — точка расширения на новые разделы меню
│   ├── AdminLocaleContext/      # глобальный языковой контекст админки (переключатель в top-bar)
│   ├── TokenGate/               # авторизация (fine-grained PAT)
│   ├── RichTextEditor/          # WYSIWYG (TipTap), data-driven toolbar, сериализация в markdown-строку
│   ├── TaxonomyCheckboxes/      # чекбоксы для полей-таксономий (stack/category) в формах
│   ├── useEditorData.ts         # общий "load one JSON once token ready" хук для редакторов-одиночек
│   ├── editors/
│   │   ├── ProfileEditor/, SkillsEditor/, TaxonomyEditor/  # редакторы-одиночки
│   │   ├── ProjectsList/, ProjectForm/                      # Projects: список и форма — раздельные компоненты
│   │   └── projectsData.ts                                  # data-хелперы Projects (не компонент, плоский файл)
│   ├── registry.ts              # реестр редакторов-одиночек (Profile, Skills) — точка расширения
│   └── github.ts                # единственный клиент записи в репозиторий (Contents API),
│                                 # включая per-file операции (listDir/createFile/deleteFile)
├── lib/
│   ├── data.ts                  # единственная точка чтения data/*.json и data/projects/*.json
│   └── slug.ts                  # авто-генерация slug из заголовка (кириллица → латиница)
├── locales/                   # словари react-i18next (uk, ru, en)
└── types.ts                   # общие типы, включая Localized<T> и Taxonomies
```

### Конвенция: компонент = папка

Каждый `.tsx`-файл, экспортирующий React-компонент с JSX (включая context-провайдеры),
живёт в собственной папке `ComponentName/index.tsx`. Благодаря алиасу `@/*` → `./src`
импорт вида `@/admin/TokenGate` разрешается в `TokenGate/index.tsx` автоматически —
переезд файла в папку не требует правки импортов у потребителей. Колокейтед тест —
`ComponentName/ComponentName.test.tsx` (не `index.test.tsx`, чтобы имя было видно во
вкладках редактора и в выводе test-раннера). Хуки (`useX.ts`) и чистые модули без JSX
(`github.ts`, `slug.ts`, `navConfig.ts`, `registry.ts`, `projectsData.ts`) остаются
плоскими файлами — это не компоненты. **Исключение:** `components/ui/*` — это shadcn/ui
примитивы, `components.json` (`aliases.ui: "@/components/ui"`) ожидает их плоскими, так
работает `npx shadcn add`/`diff`; перенос в папки сломал бы штатное обновление через CLI.

`app/data/*.json`, `app/data/projects/*.json` и `app/public/uploads/`
физически лежат вне `app/src/` (но внутри `app/`, не в истинном корне репо —
там только dev/AI-tooling, см. `AGENTS.md`) — это "база данных" проекта; к
ней есть ровно два входа: `lib/data.ts` (чтение, используется и публичной
частью, и админкой) и `admin/github.ts` (запись, используется только
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
- ✅ `admin/*` → `components/ui`, `lib/data.ts` (чтение), `admin/github.ts` (запись), `types.ts`
- ✅ `admin/editors/*` → регистрируются в `admin/registry.ts` (редакторы-одиночки) или в роутах `pages/Admin.tsx` (сущности со списком/CRUD и с параметром вроде `:key`/`:slug`); друг на друга editors не ссылаются
- ❌ `pages/*` (публичные) НЕ импортируют ничего из `admin/` — админка не должна попадать в публичный бандл иначе, чем как отдельный ленивый роут
- ❌ Компоненты публичной части и `admin/editors/*` не делают собственных fetch/GET к GitHub API напрямую — только через `lib/data.ts` / `admin/github.ts`
- ❌ Ничего, кроме `admin/github.ts`, не формирует PUT-запросы к GitHub Contents API

## Взаимодействие модулей

- Публичная часть и админка взаимодействуют только через данные (`data/*.json`, `data/projects/*.json`), не напрямую через код — это и есть граница модуля, как в классическом modular monolith, где обычно используется shared DB/API, а здесь — общий JSON + общий `lib/data.ts`.
- Локаль — сквозной cross-cutting concern в обеих частях, но с двумя независимыми контекстами: HashRouter передаёт локаль в публичную часть через `hooks/useLocale.ts` (см. `portfolio-i18n-content`); в админке — отдельный `admin/AdminLocaleContext.tsx` с переключателем в top-bar (не читается и не пишется публичной частью, персистится под другим ключом `localStorage`). Оба используют одну и ту же pure-функцию фолбэка `resolveLocalized()` из `types.ts`.
- Новая сущность контента добавляется без изменения общего кода: JSON-файл (или папка per-item файлов) в `data/` + тип в `types.ts` + редактор в `admin/editors/` + запись в `admin/registry.ts` (для редакторов-одиночек) или в `admin/navConfig.ts` (для пунктов сайдбара с собственным списком/CRUD, как Projects). `lib/data.ts` и `admin/github.ts` уже дженерик по пути к файлу/папке.
- Таксономии (`data/taxonomies.json`: `stack`, `category`, `role`) — управляемые словари для полей-чекбоксов/select в формах контента, редактируются через обобщённый `admin/editors/TaxonomyEditor.tsx` (один компонент на все три таксономии, параметризован ключом из `:key` роута). Удаление термина не каскадно правит уже сохранённые записи — только предупреждает о количестве использований.

## Ключевые принципы

1. **Один вход на чтение, один на запись.** Ни один компонент не читает `data/*.json` напрямую и не делает свой fetch к GitHub API — всё идёт через `lib/data.ts` (чтение) или `admin/github.ts` (запись).
2. **Admin — изолируемый модуль.** Ссылок на `/#/admin` из публичной части нет; в идеале роут админки грузится лениво (`React.lazy`), чтобы не раздувать бандл публичной части.
3. **Расширение через реестр, не через ветвление кода.** Новая сущность контента — это запись в `admin/registry.ts` или `admin/navConfig.ts`, а не `if`/`switch` в существующих компонентах.

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

### Реестр редакторов-одиночек (`admin/registry.ts`) и сайдбар (`admin/navConfig.ts`)

```ts
// admin/registry.ts — редакторы без списка/CRUD (один файл = одна сущность)
export const editorRegistry = [
  { id: 'profile', path: 'app/data/profile.json', label: 'Профиль', Editor: ProfileEditor },
  { id: 'skills', path: 'app/data/skills.json', label: 'Скиллы', Editor: SkillsEditor },
] as const;

// admin/navConfig.ts — структура сайдбара (WordPress-style группы с подменю)
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
независимы и общаются с данными только через `admin/github.ts`. Сущности с
собственным списком/CRUD (сейчас — только Projects) получают отдельные роуты
в `pages/Admin.tsx` (`/admin/projects`, `/admin/projects/new`,
`/admin/projects/:slug`) вместо записи в `editorRegistry`.

## Антипаттерны

- ❌ Компонент публичной части, импортирующий что-то из `admin/` (даже типы — типы должны быть в `types.ts`, доступном обоим модулям).
- ❌ Прямой `fetch('https://api.github.com/...')` внутри компонента формы редактора вместо вызова `admin/github.ts`.
- ❌ Дублирование логики фолбэка локали (`field[locale] ?? field.uk`) в нескольких местах вместо единой `resolveLocalized()` (используется и публичным `useLocalized()`, и админским `useAdminLocalized()`) — см. `portfolio-i18n-content`.
- ❌ Хранение PAT где-либо, кроме `localStorage`, или его логирование/передача в аналитику.
