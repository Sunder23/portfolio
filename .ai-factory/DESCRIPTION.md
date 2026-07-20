# Портфолио-сайт с self-hosted админкой

## Обзор

Статичный сайт-портфолио (личный сайт разработчика), который собирается быстро, стоит 0 грн/мес и редактируется через собственную встроенную админку прямо в браузере — без сервера и без базы данных. Хостинг — GitHub Pages. Единственный источник правды для контента — JSON-файлы в репозитории (`/data/*.json`, `/public/uploads/`). Сохранение из админки выполняется как коммит в репозиторий через GitHub Contents REST API (fine-grained PAT).

## Ключевые принципы

- Никакого сервера — всё работает как статика на GitHub Pages.
- Данные лежат в репозитории, а не в БД.
- Запись из админки = commit + push через GitHub REST API.
- Изменения на проде появляются после пересборки Pages (~1–2 мин) — ожидаемое поведение, а не баг.

## Основные возможности

- Публичная часть: Home, Projects (грид, сортировка по `order`), ProjectDetail (галерея + markdown-описание), About.
- Админка на скрытом роуте `/#/admin`: TokenGate (fine-grained PAT), CRUD проектов, редакторы profile.json и skills.json, markdown-поля с превью.
- Загрузка и сжатие изображений в браузере (canvas → webp, ≤300 КБ) с записью через Contents API.
- Мультиязычность uk/ru/en: UI-строки через react-i18next, локализуемый контент как объекты `{ uk, ru, en }`, локаль в hash-роуте.
- Лиды с контактной формы уходят в Telegram через relay на Google Apps Script (токен бота не светится в клиентском коде).

## Технологический стек

- **Язык / фреймворк:** React 19 + Vite + TypeScript (архитектура допускает замену компонентного слоя на Vue 3 без переделки остального)
- **Роутинг:** React Router в режиме `HashRouter` (без 404-хака на GitHub Pages)
- **UI:** Tailwind + shadcn/ui (компоненты копируются в `src/components/ui/`, используются и в публичной части, и в админке)
- **i18n:** react-i18next
- **Формы:** react-hook-form + zod (клиентская валидация, `pages/Contact.tsx`)
- **Тесты:** Vitest + React Testing Library (`npm run test`), для ключевой логики (slug, GitHub Contents API хелперы, языковой контекст админки, чекбоксы таксономий)
- **Markdown:** `marked` + `DOMPurify` — рендер markdown-полей (`description`, `bio`) на публичной части (`components/MarkdownContent.tsx`, используется в `ProjectDetail.tsx`); в админке те же поля редактируются визуально через TipTap (`admin/components/LocalizedField/RichTextEditor/index.tsx` + `tiptap-markdown`), с сериализацией обратно в markdown-строку — формат хранения общий для обеих частей
- **State management:** отсутствует — React Context + fetch/import JSON
- **База данных:** отсутствует — JSON-файлы в `/data/` как единственный источник данных
- **Хранилище файлов:** `/public/uploads/` в репозитории, запись через GitHub Contents API
- **Деплой:** GitHub Actions → GitHub Pages
- **Интеграции:** GitHub Contents API (сохранение из админки), GitHub REST API — публичное чтение коммитов без токена (секция "$ git log --oneline" на главной, `src/lib/commits.ts`), Google Apps Script + Telegram Bot API (лиды с контактной формы)

## Структура репозитория

```
/
├── app/                     # приложение целиком: код + build-конфиг (package.json, vite.config.ts, tsconfig*)
│   ├── data/
│   │   ├── profile.json        # имя, титул, био, контакты, соцсети
│   │   ├── projects/           # по одному JSON-файлу на проект: {slug}.json
│   │   ├── taxonomies.json     # управляемые словари: stack, category, role
│   │   └── skills.json         # стек, категории
│   ├── public/
│   │   └── uploads/             # картинки проектов (webp)
│   └── src/
│       ├── App.tsx               # корневой компонент — плоский файл (единственное исключение
│       │                           из конвенции "компонент = папка", см. ARCHITECTURE.md)
│       ├── pages/                # Home/ (12 колокейтед секций-компонентов + constants.ts), Projects/
│       │                           (включая ProjectFilters/), ProjectDetail/, About/, Contact/,
│       │                           NotFound/ (catch-all внутри каждого per-locale роута), Admin/
│       ├── components/           # Nav/ (включая ThemeToggle/), ProjectCard/, layouts/PublicLayout/, ... —
│       │                           только реально shared (2+ потребителя) + два исключения
│       │                           (Nav/Footer/Scanline; components/ui/ — плоские shadcn-примитивы
│       │                           + ручной heading.tsx, единственная не-shadcn добавка туда)
│       ├── hooks/                # useLocale (осознанное исключение из правила про context/,
│       │                           см. ARCHITECTURE.md), useLocalized, useAsyncData, useDocumentMeta
│       ├── admin/                # всё, что относится к админке — сгруппировано по типу
│       │   ├── context/            # AdminAuthContext/, AdminLocaleContext/, AdminDraftContext/ —
│       │   │                         любой createContext-файл живёт здесь, а не в components/
│       │   ├── components/         # AdminLayout/ (+ AdminSidebar/, TokenGate/, SaveAllButton/ вложены),
│       │   │                         LocalizedField/ (+ RichTextEditor/ вложен), ImageUploadField/
│       │   ├── hooks/              # useSessionCheck.ts, useEditorData.ts, useAdminSave.ts
│       │   ├── lib/                # github.ts (Contents API), resolvePendingImages.ts, navConfig.ts,
│       │   │                         registry.ts, pat.ts, imageCompress.ts
│       │   └── editors/            # ProfileEditor/, SkillsEditor/, TaxonomyEditor/, ProjectsList/,
│       │                             ProjectForm/ (+ TaxonomyCheckboxes/, GalleryUploadField/ вложены), projectsData.ts
│       ├── lib/
│       │   ├── data.ts           # загрузка и типизация JSON (projects/ — через import.meta.glob)
│       │   └── slug.ts           # авто-slug из заголовка (кириллица → латиница)
│       ├── locales/               # словари react-i18next (uk, ru, en)
│       └── types.ts
└── .github/workflows/deploy.yml   # working-directory: app, path: app/dist
```

Конвенция: каждый React-компонент (`.tsx` с JSX) живёт в собственной папке `Name/index.tsx` — подробности и исключения (`components/ui/*`, корневой `App.tsx`) см. в `.ai-factory/ARCHITECTURE.md`.

`.ai-factory/`, `.claude/`, `.github/`, `.mcp.json`, `AGENTS.md`, `PLAN.md`, `skills-lock.json` остаются в истинном корне репозитория (dev/AI-tooling — сами инструменты ищут их только там), `app/` — единственная папка продукта.

## Архитектурные заметки

- Каждая сущность контента = тройка «JSON-файл (или папка per-item файлов) в `/data/` + тип в `types.ts` + редактор в `admin/editors/`». Добавление новой сущности (блог, отзывы, сертификаты) не требует изменения общего кода: `admin/lib/github.ts` и `lib/data.ts` работают с любым файлом/папкой по пути через дженерик-хелперы, а список разделов в сайдбаре собирается из `admin/lib/navConfig.ts` (редакторы-одиночки — из `admin/lib/registry.ts`).
- Проекты — не единый массив, а по одному файлу на проект: `data/projects/{slug}.json`. `slug` — единственный идентификатор проекта (отдельного поля `id` нет), генерируется автоматически из заголовка (см. `lib/slug.ts`) с ручной перезаписью и дедупликацией при коллизии. Смена slug у существующего проекта = создание нового файла + удаление старого (в этом порядке, чтобы сбой между двумя запросами не терял данные).
- Таксономии (`data/taxonomies.json`): управляемые словари `stack`/`category`/`role` — в формах проекта выбираются чекбоксами/select вместо ручного ввода текста.
- Локализуемые поля контента — объекты вида `{ "uk": "…", "ru": "…", "en": "…" }`, тип-хелпер `Localized<T>` и общая функция фолбэка `resolveLocalized()`, используемая и публичным `useLocalized()`, и админским `useAdminLocalized()` (читает свой собственный языковой контекст — `admin/context/AdminLocaleContext/index.tsx`, независимый от локали публичной части).
- Markdown-поля (`description`, `bio`) редактируются визуально через TipTap (`admin/components/LocalizedField/RichTextEditor/index.tsx`), но хранятся как обычная markdown-строка — формат данных не меняется, меняется только UX редактирования.
- Запись файла через Contents API: `GET` за текущим `sha` → `PUT` с `{ message, content, sha }` → при 409 повторить `GET`+`PUT` один раз, иначе показать ошибку. Создание нового файла (`createFile`) не отправляет `sha`; удаление (`deleteFile`) требует его. PAT никогда не попадает в код/коммиты, хранится только в `localStorage`.
- Сохранение в админке батчится: правки любого числа сущностей (посты, профиль, скиллы) за одну сессию копятся как черновики в `admin/context/AdminDraftContext/` (in-memory, keyed по пути файла, не переживает обновление страницы — осознанный выбор для одного пользователя) и коммитятся все разом по клику на единственную плавающую кнопку "Сохранить всё" (`admin/components/AdminLayout/SaveAllButton/`), которая последовательно вызывает зарегистрированный `flush` каждой изменённой сущности. `TaxonomyEditor` — осознанное исключение: коммитит мгновенно на каждое действие (add/rename/delete термина), в батчинг не включён. Картинки (`cover`/`gallery`/`avatar`) не грузятся в GitHub по выбору файла — только компрессируются локально (`admin/lib/imageCompress.ts`) и хранятся как `PendingImage {blob, previewUrl}` до момента "Сохранить всё", когда `admin/lib/resolvePendingImages.ts` грузит их и подставляет реальные пути.
- Прямые запросы к Telegram Bot API из браузера запрещены (токен бота не должен светиться в клиентском коде) — обязателен relay на Google Apps Script.

## Нефункциональные требования

- **Производительность:** lighthouse ≥ 90 по всем категориям, `loading="lazy"` для изображений, сжатие загружаемых картинок до ≤300 КБ.
- **Безопасность:** fine-grained PAT с правами только на этот репозиторий (`Contents: Read/Write`), токен бота Telegram скрыт за Apps Script relay, honeypot + rate-limit (CacheService) для антиспама формы.
- **Доступность/адаптивность:** адаптивная вёрстка, тёмная/светлая тема по `prefers-color-scheme`.
- **Локализация:** обязательна только украинская версия контента, остальные локали фолбэкаются на uk; `lang` на `<html>` меняется с локалью, мета-теги/OG локализованы.
- **Устойчивость к ошибкам:** конфликт `sha` при параллельной записи обрабатывается повтором; истёкший PAT (401) показывает TokenGate заново, а не падает молча.

## Архитектура

Подробные архитектурные правила — в `.ai-factory/ARCHITECTURE.md`.
Паттерн: Modular Monolith (frontend-адаптация) — публичная часть и админка как два строго разделённых модуля с единой точкой чтения (`lib/data.ts`) и единой точкой записи (`admin/lib/github.ts`) данных.

## Осознанно вне скоупа v1

- OAuth-логин через GitHub (требует сервера для client_secret) — используется PAT.
- БД, полнотекстовый поиск, комментарии, серверная аналитика.
- Запись лидов в репозиторий/CSV — невозможна без утечки write-токена; лиды идут в Telegram.
- WYSIWYG-редактор — только markdown + превью.
- Отдельный стейт «черновик» — роль черновика выполняет `published: false`.

## Этапы (roadmap-уровень)

0. Каркас: Vite + React + TS, роутер, workflow деплоя, валидные пустые JSON.
1. Публичная часть + i18n с первого дня.
2. Админка: данные (TokenGate, admin/lib/github.ts, CRUD).
3. Админка: загрузка и сжатие картинок.
4. Лиды: форма → Apps Script relay → Telegram.
5. Полировка: темы, мета-теги, lighthouse, favicon, README.

Подробности каждого этапа и подводные камни — см. `PLAN.md` в корне репозитория (первичный источник, из которого сформирован этот файл).
