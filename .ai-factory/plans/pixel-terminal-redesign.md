# Пиксельный редизайн публичной части (Terminal / hacker)

**Branch:** `feature/pixel-terminal-redesign`
**Создан:** 2026-07-19
**Затрагивает:** только публичную часть (`app/src/pages/{Home,Projects,ProjectDetail,About,Contact}`, `app/src/components/{Nav,ProjectCard,PublicLayout,ThemeToggle,LocaleSwitcher}`, `app/src/index.css`, `app/src/locales/*.json`). Админка (`app/src/admin/**`, `app/src/pages/Admin`) не трогается — по решению пользователя она уже устраивает и архитектурно изолирована от публичной части.

## Контекст

Пользователь выбрал стиль **Terminal / hacker** из трёх визуальных вариантов (Terminal, 8-bit Arcade, GameBoy 4-tone), показанных в артефакте-мокапе на реальном контенте (profile.json/skills.json/projects/experience.json). Направление: тёмный монохромный терминал (фосфорно-зелёный на чёрном) со вторым, светлым вариантом («бумажный терминал» — тёмно-зелёный текст на кремовом фоне), моноширинный шрифт, ASCII/command-style акценты (`$ ls`, `$ cat`, мигающий курсор `_`).

Полный редизайн — стиль применяется по всему публичному сайту (не только Hero), с сохранением текущего переключателя light/dark (next-themes): каждая тема получает свой терминальный вариант палитры, а не отключается.

## Настройки

- **Тесты:** да — Vitest + RTL для новых shared-компонентов (`CommandLabel`, `TerminalCursor`, `Footer`), по аналогии с существующими тестами в `admin/**` и `lib/slug.test.ts`. Страницы (Home/Projects/...) — без отдельных тестов, это чисто визуальный рефактор существующей логики.
- **Логирование:** verbose по умолчанию — `console.debug` в местах, где есть реальная логика (загрузка данных в Footer/Home, проверка `prefers-reduced-motion` в Scanline). Чисто презентационные компоненты/страницы — без логирования (явно отмечено в каждой задаче).
- **Документация:** да, обязательный чекпоинт в конце — через `/aif-docs`, описать токен-скоуп `.pixel-terminal` и новые shared-компоненты.

## Ключевое архитектурное решение

Стиль внедряется **через CSS-токены, а не через форк shadcn-компонентов** — в духе принципа проекта «расширение через реестр/токены, а не через ветвление кода» (см. `.ai-factory/ARCHITECTURE.md`):

- В `app/src/index.css` заводится scope-класс `.pixel-terminal`, который переопределяет `--background/--foreground/--primary/--accent/--muted/--border/--radius/--font-heading/--font-sans` для светлого варианта, и `.dark .pixel-terminal { ... }` — для тёмного (тот же паттерн, что уже используют `:root` / `.dark` в файле).
- `--radius: 0` внутри скоупа — квадратные углы у Button/Card/Badge/Input без правки самих shadcn-компонентов (они остаются как есть, `components/ui/*` не трогаем — это соответствует конвенции "shadcn CLI ожидает эти файлы плоскими и стандартными").
- Класс `.pixel-terminal` вешается **только** на корневой div `PublicLayout` — поэтому `AdminLayout` и всё под `/#/admin` не затрагиваются автоматически, без единого `if`.
- Шрифт: `@fontsource/vt323` (пиксельный, самохостится так же, как уже используемый `@fontsource-variable/geist`) — только для заголовков/лейблов/кнопок (`--font-heading`). Основной текст (био, markdown-описания) остаётся на системном monospace-стеке для читаемости на длинных абзацах.

## Roadmap Linkage

Milestone: **"Этап 8 — Пиксельный редизайн публичной части"** (новый, отсутствует в `.ai-factory/ROADMAP.md` — добавление самой записи через `/aif-roadmap`, `/aif-plan` не редактирует ROADMAP.md напрямую).
Rationale: логичное продолжение роадмапа после Этапов 0/1/5/6/7 (каркас → публичная часть → полировка → админка) — переход от нейтрального shadcn-вида к собственной визуальной идентичности публичной части.

## Секции по страницам

- **Home:** Hero (имя + мигающий курсор, тайтл, био, CTA) → Стек (`$ cat skills.txt`, теги из skills.json) → Избранные проекты (`$ ls ./projects --featured`, 2 карточки с `featured: true`) → Опыт кратко (`$ history --work | tail -1`, только текущая позиция, ссылка на полную версию в About).
- **Projects:** список без изменений в логике, заголовок как command-label.
- **ProjectDetail:** back-link как `$ cd ..`, role/year как `key: value` строки, галерея в пиксельных рамках с подписями, CTA как команда.
- **About:** Hero-мини + полный Experience-таймлайн как терминальные панели (`$ history --job=N`) + тот же Stack-стиль, что на Home + контакты как `> mailto:` / `> github:` строки.
- **Contact:** форма без изменений в zod/react-hook-form логике, только визуал (`[ name ]`-лейблы, `$ send --message` кнопка).
- **Footer (новый):** локация, email, соцсети, короткая status-строка — только в PublicLayout.

## Задачи

Полный список задач с зависимостями и файлами — см. таск-трекер (`TaskList`), задачи #1–#16. Кратко по фазам:

**Фаза 1 — токены и общие компоненты (#1–#8)**
1. [x] Зависимость `@fontsource/vt323`
2. [x] Токены `.pixel-terminal` / `.dark .pixel-terminal` в `index.css`
3. [x] `components/Scanline` (CRT-оверлей, reduced-motion)
4. [x] `components/CommandLabel` (+ тест)
5. [x] `components/TerminalCursor` (+ тест)
6. [x] `components/Footer` (+ тест, + i18n-ключи uk/ru/en)
7. [x] Подключение скоупа/Scanline/Footer в `PublicLayout`
8. [x] Рестайл `Nav`/`ThemeToggle`/`LocaleSwitcher` (Nav — bracket-style + accent; ThemeToggle/LocaleSwitcher уже наследуют токены автоматически, без правок)

**Фаза 2 — страницы (#9–#14)**
9. [x] `ProjectCard` — проверка/подстройка под токены (граница + `$ open` hover-подсказка)
10. [x] `Home` — новая структура секций (+ i18n-ключи)
11. [x] `Projects` — command-label заголовок
12. [x] `ProjectDetail` — command-style детали и рамки галереи
13. [x] `About` — command-labels, терминальные панели опыта (+ `CommandLabel` получил `label`-проп для доступного имени, backfill на Home/Projects)
14. [x] `Contact` — визуал формы

**Фаза 3 — проверка и документация (#15–#16)**
15. [x] Ручная проверка light/dark вариантов на всех публичных роутах + регрессия админки (первый проход вскрыл слишком яркую/неоновую dark-палитру и слишком "плоский" Hero — палитра пересмотрена (`--foreground` смягчён до salvia-тона, `--primary` стал тёмно-зелёным вместо неонового), Hero получил рамку "terminal window" + аватар + glow на имени; повторная проверка на прод-сборке (`vite preview`, для корректного `/portfolio/` base у аватара) — подтверждено)
16. Документация (`/aif-docs`)

## Commit Plan

1. `feat(theme): scaffold terminal pixel-style tokens and shared components` — задачи #1–#8
2. `feat(public): restyle Home/Projects/ProjectDetail/About with terminal sections` — задачи #9–#13
3. `test(public): restyle contact form, add terminal UI test coverage, verify no admin regression` — задачи #14–#15
4. `docs: document terminal pixel design system` — задача #16

## Вне скоупа

- Админка (`admin/**`) — визуально не меняется.
- Контактная форма → Telegram relay (Этап 4 роадмапа) — не реализуется в этом плане, только визуал существующей формы.
- 8-bit Arcade и GameBoy варианты из мокапа — не реализуются (можно вернуться к ним позже как к альтернативным темам, если понадобится).
