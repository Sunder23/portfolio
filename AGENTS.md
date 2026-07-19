# AGENTS.md

> Этот файл поддерживается вручную и через `/aif`. При значительном изменении структуры проекта — обновить.

## Обзор проекта

Статичный сайт-портфолио на React + Vite + TS с self-hosted админкой без бэкенда и БД: контент хранится в `/data/*.json`, сохранение из админки — коммит через GitHub Contents API. Хостинг — GitHub Pages. Подробности — `.ai-factory/DESCRIPTION.md`.

## Технологический стек

- **Язык / фреймворк:** React 19 + Vite + TypeScript
- **Роутинг:** React Router (`HashRouter`)
- **UI:** Tailwind + shadcn/ui
- **i18n:** react-i18next (см. `portfolio-i18n-content` в разделе «AI Context Files»)
- **База данных:** отсутствует — JSON в репозитории
- **Деплой:** GitHub Actions → GitHub Pages

## Структура проекта

> Структура ниже соответствует физическому состоянию репозитория. Проект реализован полностью (публичная часть + i18n, админка с данными/картинками/CRUD, лиды, полировка). Конвенция: каждый React-компонент живёт в собственной папке `Name/index.tsx` — подробности в `.ai-factory/ARCHITECTURE.md`.

```
/
├── app/                        # всё приложение: код + build-конфиг (npm run * запускается отсюда)
│   ├── data/                     # profile.json, projects/{slug}.json, taxonomies.json, skills.json
│   ├── public/uploads/            # изображения проектов (webp), пишутся из админки
│   ├── src/
│   │   ├── App.tsx                 # корневой компонент — плоский файл (единственное исключение
│   │   │                             из конвенции "компонент = папка", см. .ai-factory/ARCHITECTURE.md)
│   │   ├── pages/                  # Home/, Projects/, ProjectDetail/, About/, Contact/, Admin/
│   │   ├── components/              # переиспользуемые UI-компоненты (+ components/ui — плоские shadcn-примитивы)
│   │   ├── hooks/                   # useLocale, useLocalized, useAsyncData, useDocumentMeta
│   │   ├── admin/                   # весь код админки, сгруппирован по типу: components/, hooks/, lib/ (github.ts, registry.ts, navConfig.ts), editors/
│   │   ├── lib/                     # data.ts — загрузка и типизация JSON, slug.ts
│   │   └── locales/                  # словари react-i18next (uk, ru, en)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
├── .ai-factory/                # конфигурация и артефакты AI Factory (dev-tooling, не часть приложения)
├── .claude/                    # skills/agents для Claude Code
├── .github/workflows/deploy.yml
└── PLAN.md
```

`.ai-factory/`, `.ai-factory.json`, `.claude/`, `.github/`, `.mcp.json`, `skills-lock.json`, `AGENTS.md`, `PLAN.md` остаются в истинном корне репозитория — это dev/AI-tooling файлы, которые сами инструменты (git, GitHub Actions, Claude Code, AI Factory CLI) ищут только там.

## Ключевые точки входа

| Файл | Назначение |
|------|------------|
| `PLAN.md` | Первичная спецификация проекта (рус.), источник для `.ai-factory/DESCRIPTION.md` |
| `.ai-factory/config.yaml` | Конфигурация AI Factory для этого проекта (язык, пути, git-workflow) |

## Документация

| Документ | Путь | Описание |
|----------|------|----------|
| PLAN | PLAN.md | Первичная детальная спецификация проекта |
| README | README.md | Landing page: обзор, стек, быстрый старт, ссылки на docs/ |
| Dev workflow | docs/dev-workflow.md | Локальная разработка, проверка сборки, деплой, git-pull gotcha |
| Admin workflow | docs/admin-workflow.md | Редактирование контента через админку, картинки, обработка ошибок |
| Design system | docs/design-system.md | Пиксельная терминальная дизайн-система публичной части (токен-скоуп, палитра, шрифт, shared-компоненты) |

## AI Context Files

| Файл | Назначение |
|------|------------|
| AGENTS.md | Этот файл — структурная карта проекта для AI-агентов |
| .ai-factory/DESCRIPTION.md | Спецификация проекта: стек, возможности, архитектурные заметки |
| .ai-factory/ARCHITECTURE.md | Архитектурный паттерн, структура папок, правила зависимостей (генерируется `/aif-architecture`) |
| .ai-factory/rules/base.md | Базовые конвенции проекта (именование, структура модулей, обработка ошибок) |
| .claude/skills/portfolio-i18n-content | Схема мультиязычности uk/ru/en для этого проекта |
| .claude/skills/portfolio-admin-github-write | Workflow сохранения данных из админки через GitHub Contents API |

## Правила для агентов

- Декомпозировать составные shell-команды на отдельные шаги вместо `&&`.
  - Неправильно: `git checkout main && git pull`
  - Правильно: сначала `git checkout main`, затем `git pull origin main`
