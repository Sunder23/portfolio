# Портфолио-сайт

Статичный сайт-портфолио на React + Vite + TypeScript с self-hosted админкой прямо в браузере — без сервера и без базы данных. Контент хранится как JSON в репозитории, сохранение из админки — коммит в `main` через GitHub Contents API. Хостинг — GitHub Pages, ноль расходов на инфраструктуру.

🔗 Живой сайт: https://sunder23.github.io/portfolio/

## Технологический стек

- React 19 + Vite + TypeScript
- React Router (`HashRouter`)
- Tailwind + shadcn/ui
- react-i18next (uk/ru/en)
- react-hook-form + zod (валидация форм)

## Быстрый старт

```bash
cd app
npm install
npm run dev
```

Подробности локальной разработки, проверки сборки и деплоя — [docs/dev-workflow.md](./docs/dev-workflow.md).

## Деплой

```
git push origin main → GitHub Actions → GitHub Pages
```

Полностью автоматический, без ручных шагов. Нюансы и важная оговорка про общую с админкой ветку `main` — там же, в [docs/dev-workflow.md](./docs/dev-workflow.md).

## Редактирование контента

Контент (проекты, профиль, скиллы, картинки) редактируется через встроенную админку на скрытом роуте `/#/admin`, без бэкенда — сохранение идёт напрямую в репозиторий через GitHub Contents API. Как получить доступ и как это устроено — [docs/admin-workflow.md](./docs/admin-workflow.md).

## Документация

| Документ | Описание |
|----------|----------|
| [docs/dev-workflow.md](./docs/dev-workflow.md) | Локальная разработка, проверка сборки, деплой, git-workflow |
| [docs/admin-workflow.md](./docs/admin-workflow.md) | Редактирование контента через админку, загрузка картинок, обработка ошибок |
| [AGENTS.md](./AGENTS.md) | Структурная карта проекта для AI-агентов |
| [PLAN.md](./PLAN.md) | Первичная детальная спецификация проекта |
