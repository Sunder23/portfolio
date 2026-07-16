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
src/
├── pages/                  # Публичный модуль: Home, Projects, ProjectDetail, About
│   └── admin/                # (роут /#/admin) — отдельная точка входа, см. admin/
├── components/              # Переиспользуемые UI-компоненты публичной части
│   └── ui/                   # shadcn/ui — общие для публичной части и админки
├── admin/                   # Admin-модуль — самодостаточный, не импортируется публичной частью
│   ├── AdminLayout.tsx
│   ├── TokenGate.tsx         # авторизация (fine-grained PAT)
│   ├── editors/               # формы редактирования по сущностям
│   ├── registry.ts            # реестр редакторов — точка расширения на новые сущности
│   └── github.ts              # единственный клиент записи в репозиторий (Contents API)
├── lib/
│   └── data.ts                # единственная точка чтения data/*.json (аналог repository-слоя)
├── locales/                  # словари react-i18next (uk, ru, en)
└── types.ts                  # общие типы, включая Localized<T>
```

`data/*.json` и `public/uploads/` физически лежат вне `src/` (в корне репо) —
это "база данных" проекта; к ней есть ровно два входа: `lib/data.ts` (чтение,
используется и публичной частью, и админкой) и `admin/github.ts` (запись,
используется только админкой).

## Правила зависимостей

- ✅ `pages/*` (публичные) → `components/`, `lib/data.ts`, `locales/`
- ✅ `admin/*` → `components/ui`, `lib/data.ts` (чтение), `admin/github.ts` (запись), `types.ts`
- ✅ `admin/editors/*` → только `admin/registry.ts` регистрирует их, друг на друга editors не ссылаются
- ❌ `pages/*` (публичные) НЕ импортируют ничего из `admin/` — админка не должна попадать в публичный бандл иначе, чем как отдельный ленивый роут
- ❌ Компоненты публичной части и `admin/editors/*` не делают собственных fetch/GET к GitHub API напрямую — только через `lib/data.ts` / `admin/github.ts`
- ❌ Ничего, кроме `admin/github.ts`, не формирует PUT-запросы к GitHub Contents API

## Взаимодействие модулей

- Публичная часть и админка взаимодействуют только через данные (`data/*.json`), не напрямую через код — это и есть граница модуля, как в классическом modular monolith, где обычно используется shared DB/API, а здесь — общий JSON + общий `lib/data.ts`.
- Локаль (см. `portfolio-i18n-content`) — сквозной cross-cutting concern, а не отдельный модуль: HashRouter передаёт локаль в публичную часть, но не в админку.
- Новая сущность контента добавляется без изменения общего кода: JSON-файл в `data/` + тип в `types.ts` + запись в `admin/registry.ts` + редактор в `admin/editors/`. `lib/data.ts` и `admin/github.ts` уже дженерик по пути к файлу.

## Ключевые принципы

1. **Один вход на чтение, один на запись.** Ни один компонент не читает `data/*.json` напрямую и не делает свой fetch к GitHub API — всё идёт через `lib/data.ts` (чтение) или `admin/github.ts` (запись).
2. **Admin — изолируемый модуль.** Ссылок на `/#/admin` из публичной части нет; в идеале роут админки грузится лениво (`React.lazy`), чтобы не раздувать бандл публичной части.
3. **Расширение через реестр, не через ветвление кода.** Новая сущность контента — это запись в `admin/registry.ts`, а не `if`/`switch` в существующих компонентах.

## Примеры кода

### Единая точка чтения данных (`lib/data.ts`)

```ts
// lib/data.ts
import type { Project, Profile, SkillCategory } from '../types';

export async function getProjects(): Promise<Project[]> {
  const data = await import('../../data/projects.json');
  return data.default;
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

### Расширяемый реестр редакторов админки (`admin/registry.ts`)

```ts
// admin/registry.ts
export const editorRegistry = [
  { id: 'projects', path: 'data/projects.json', label: 'Проекты', Editor: ProjectsEditor },
  { id: 'profile', path: 'data/profile.json', label: 'Профиль', Editor: ProfileEditor },
  { id: 'skills', path: 'data/skills.json', label: 'Скиллы', Editor: SkillsEditor },
  // новая сущность — просто новая запись здесь + свой Editor-компонент
] as const;
```

Ни один `Editor`-компонент не импортирует другой `Editor` — они полностью
независимы и общаются с данными только через `admin/github.ts`.

## Антипаттерны

- ❌ Компонент публичной части, импортирующий что-то из `admin/` (даже типы — типы должны быть в `types.ts`, доступном обоим модулям).
- ❌ Прямой `fetch('https://api.github.com/...')` внутри компонента формы редактора вместо вызова `admin/github.ts`.
- ❌ Дублирование логики фолбэка локали (`field[locale] ?? field.uk`) в нескольких местах вместо единого `useLocalized()` — см. `portfolio-i18n-content`.
- ❌ Хранение PAT где-либо, кроме `localStorage`, или его логирование/передача в аналитику.
