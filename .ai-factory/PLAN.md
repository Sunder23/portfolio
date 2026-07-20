# План: секция "$ git log --oneline" на главной странице

**Создан:** 2026-07-20
**Режим:** fast
**Ветка:** нет (fast-режим без git-веток)

## Идея

На главной (`Home`) появляется секция с последними коммитами репозитория, оформленная под существующую терминальную эстетику сайта (рядом с уже готовыми `$ whoami`, `$ cat skills.txt`, `$ top ./stack`). Название решено через `CommandLabel`: заголовок-псевдокоманда `$ git log --oneline` (не переводится, как и остальные псевдокоманды) + человекочитаемый `label` на каждой локали ("Останні коміти" / "Последние коммиты" / "Recent commits").

Данные берутся напрямую с публичного GitHub REST API (`Sunder23/portfolio`, реальный `origin` репозитория) — без токена, без бэкенда, укладывается в принцип сайта "никакого сервера".

## Settings

- **Testing:** да — unit-тест на `lib/commits.ts` (успешный маппинг + отказоустойчивость при ошибке fetch)
- **Logging:** verbose — `console.debug` при успешной загрузке, `console.error` при сбое (без падения страницы)
- **Docs:** не запрашивалось (fast-режим)

## Roadmap Linkage

Milestone: "none"
Rationale: ни одна открытая веха (лиды/Apps Script) не описывает эту фичу — самостоятельное небольшое улучшение главной страницы, привязка не нужна.

## Ключевые решения

- **Источник данных:** `GET https://api.github.com/repos/Sunder23/portfolio/commits?per_page=5` — публичный эндпоинт, аутентификация не нужна (это не тот же `admin/lib/github.ts`, который пишет через PAT — здесь только чтение, новый файл `src/lib/commits.ts`).
- **Отказоустойчивость:** секция не блокирует рендер остальной страницы. `commits` не входит в общий gate `if (!profile || !skills || ...)` — при сбое/медленном ответе GitHub остальная главная страница как и раньше рендерится мгновенно (все прочие данные — локальные JSON-импорты), а блок коммитов просто не появляется (`commits && commits.length > 0`), как и другие опциональные секции (`featured`, `testimonials`).
- **Формат:** 5 коммитов, каждая строка — короткий hash (7 симв.) + первая строка сообщения коммита + относительная дата (`Intl.RelativeTimeFormat`, встроенный в браузер — новая зависимость не нужна, в проекте date-fns/dayjs нигде не используются). Без кликабельных ссылок на GitHub (осознанно, по выбору из вариантов).
- **Расположение на странице:** изначально было сразу после блока статистики; по итогам ручной проверки перенесено сразу после секции `$ ls ./projects --featured` (после карточек featured-проектов, перед `$ whoami` из блока experience) — секция "доказательства активности" логичнее смотрится сразу за портфолио проектов, а не в самом верху.

## Tasks

1. [x] **Добавить тип `CommitSummary` в `app/src/types.ts`**
   `{ shortSha: string; message: string; date: string; url: string }`.

2. [x] **Создать `app/src/lib/commits.ts`** *(blocked by #1)*
   - `REPO = 'Sunder23/portfolio'` константа
   - `getRecentCommits(): Promise<CommitSummary[]>` — фетч, маппинг (`shortSha` = первые 7 символов sha, `message` = первая строка `commit.message`, `date` = `commit.author.date`, `url` = `html_url`), при не-OK ответе или исключении — `console.error` + возврат `[]` (никогда не throw)
   - `formatRelativeCommitDate(isoDate: string, locale: Locale): string` через `Intl.RelativeTimeFormat(locale, { numeric: 'auto' })`
   - `console.debug('[commits] loaded recent commits', { count })` при успехе

3. [x] **Локализация** — `app/src/locales/{uk,ru,en}.json`, секция `home`:
   - `commitsTitle: "git log --oneline"` (одинаково во всех трёх файлах)
   - `commitsLabel`: uk `"Останні коміти"`, ru `"Последние коммиты"`, en `"Recent commits"`

4. [x] **Вывести секцию на `app/src/pages/Home/index.tsx`** *(blocked by #2, #3)*
   - `const commits = useAsyncData(getRecentCommits)` — НЕ добавлять в существующий gate загрузки
   - секция рендерится при `commits && commits.length > 0`, сразу после секции `$ ls ./projects --featured` (см. "Ключевые решения" — перенесена туда после ручной проверки)
   - `CommandLabel` + список строк (hash / message / относительная дата) в стиле существующих `pixel-notch` блоков
   - добавить `commits?.length` в существующий `console.debug('[Home] sections loaded', ...)`

5. [x] **Тест `app/src/lib/commits.test.ts`** *(blocked by #2)*
   - маппинг успешного ответа (7-символьный hash, только первая строка message)
   - `[]` при не-OK статусе и при реджекте fetch (без throw)
   - `formatRelativeCommitDate` возвращает непустую строку (не проверять точный текст — он locale-зависимый)

## Расширение: сетка активности коммитов (heatmap)

Добавлено после первой итерации по просьбе пользователя — GitHub-style тепловая карта коммитов внутри той же секции `$ git log --oneline` (сетка сверху, список из 5 коммитов снизу).

**Источник данных:** `GET /repos/Sunder23/portfolio/stats/commit_activity` — официальный публичный GitHub stats-endpoint (коммиты по дням за последний год, только этот репозиторий; полная лента активности профиля недоступна без GraphQL+токена, поэтому не рассматривалась).

**Особенность API:** при первом обращении к репо GitHub может вернуть 202 (статистика ещё считается асинхронно) — реализована одна повторная попытка через ~1.5с, при неудаче — пустой массив (секция грида просто не рендерится, без падения).

**Цвета:** используется существующий токен `--color-accent` (Tailwind `bg-accent/15|40|70|100`), 5 уровней интенсивности по квартилям от максимума — без новых цветов/зависимостей, в стиле уже существующих pixel-square элементов на странице.

6. [x] **Добавить тип `CommitActivityWeek` в `app/src/types.ts`**
   `{ weekStart: string; days: number[] }` (7 значений, вс-сб).

7. [x] **`getCommitActivity()` в `app/src/lib/commits.ts`** *(blocked by #6)*
   Фетч `stats/commit_activity`, обработка 202 (retry один раз через ~1.5с), маппинг в `CommitActivityWeek[]`, `[]` при ошибке/повторном 202.

8. [x] **Компонент `app/src/components/CommitActivityGrid/index.tsx`** *(blocked by #6)*
   CSS grid (недели × 7 дней), `overflow-x-auto`, 5 уровней интенсивности через `bg-accent/*`, `title` на ячейку, `role="img"` + `aria-label` на весь грид, легенда "Less → More".

9. [x] **Вывести грид в секции коммитов на `Home`** *(blocked by #7, #8)*
   `useAsyncData(getCommitActivity)` (тоже вне общего loading-gate), рендер грида НАД списком коммитов внутри той же секции.

10. [x] **Тесты для `getCommitActivity`** *(blocked by #7)*
    Успешный маппинг, 202→200 retry, 202→202 (пусто), не-OK (пусто).

## Commit Plan

Основная фича (задачи 1-5) — один коммит:
`feat(home): add recent commits section fetched from GitHub API`

Расширение с сеткой активности (задачи 6-10) — отдельный коммит:
`feat(home): add commit activity heatmap to git-log section`
