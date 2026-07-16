# Этап 4 (часть 1) — Лиды: контактная форма (только вёрстка)

**Ветка:** `feature/leads-contact-form`
**Создан:** 2026-07-17

> Пользователь сузил скоуп Этапа 4: в этом плане делаем только форму и клиентскую валидацию (shadcn Form + zod). Google Apps Script relay и Telegram-бот — вне этого плана, будут отдельным follow-up.

## Settings

- **Testing:** нет — пользователь выбрал без тестов для этого плана; Vitest/RTL в проекте не настроен (см. `RULES.md`), настройка тестовой инфраструктуры откладывается до момента, когда появится код с реальной бизнес-логикой (сеть/relay), а не только форма-заглушка.
- **Logging:** Minimal — один `console.info` на сабмит формы (payload + пометка "stub, no backend yet"), без DEBUG-логов на каждый рендер/keystroke. Соответствует существующему паттерну (`console.info` в `Home.tsx`/`About.tsx` на загрузку данных).
- **Docs:** нет, warn-only. Документация по-прежнему отложена до отдельного шага (см. `RESEARCH.md`), этот план её не блокирует.

## Roadmap Linkage

- **Milestone:** "Этап 4 — Лиды" (частичный прогресс, чекбокс в `ROADMAP.md` НЕ закрывается этим планом)
- **Rationale:** Полный критерий этапа — «отправка формы приходит сообщением в TG; токен бота отсутствует в бандле» — этим планом не покрывается (relay и бот сознательно не реализуются). План закрывает только часть скоупа (форма + zod-валидация на клиенте); Apps Script relay и Telegram-интеграция — отдельный follow-up план после этого.

## Контекст кодовой базы (из разведки перед планированием)

- **Radix UI в проекте нет.** `components.json` → `style: "base-nova"`, все существующие `components/ui/*` (`Input`, `Button`, `Label`, `Textarea`) построены на `@base-ui/react`, не на `@radix-ui/react-*`. Стандартный shadcn `form.tsx` использует `@radix-ui/react-slot` — вместо добавления новой зависимости `FormControl` реализуется через `React.cloneElement` (единственный child — всегда `Input`/`Textarea`).
- **`react-hook-form`, `zod`, `@hookform/resolvers` не установлены** — нужно добавить в `app/package.json` (задача 1).
- **`<Toaster />` сейчас смонтирован только в `AdminLayout.tsx`**, в `PublicLayout.tsx` его нет — без этого `toast.success()` на `/contact` не отобразится (задача 6).
- **`sonner`, `lucide-react`, `next-themes` уже установлены и используются** (`admin/useAdminSave.ts`, `admin/useImageUpload.ts`) — паттерн `toast.success(...)` уже есть в проекте, повторно используем.
- **Локализация ошибок валидации:** т.к. у сообщений zod нужны переводы через `t()`, схема строится внутри компонента через `useMemo(() => schema, [t])`, а не как модульная константа — иначе не будет реагировать на смену локали (паттерн взят из `useLocalized`/`i18n.changeLanguage` в `App.tsx`).
- **Honeypot-поле включено в разметку** (`company`, `z.string().max(0)`) по требованию `DESCRIPTION.md` (раздел «Нефункциональные требования» → «honeypot + rate-limit для антиспама формы») — это только клиентская разметка, реальной защиты (rate-limit через CacheService) на этом этапе нет, она появится вместе с Apps Script relay.
- **Лиды НЕ пишутся никуда** (ни в JSON, ни в localStorage) — по `DESCRIPTION.md` («Осознанно вне скоупа v1»: «Запись лидов в репозиторий/CSV — невозможна без утечки write-токена»), поэтому единственный эффект сабмита сейчас — `console.info` + toast.
- **Роут `contact` — eager import**, как `Home`/`About`/`Projects` (не `React.lazy`) — lazy зарезервирован только под `/#/admin` (см. комментарий в `App.tsx`), контактная форма — часть публичного бандла.

## Tasks

### Phase 1 — Foundation (зависимости + примитивы формы)

- [x] 1. **Add react-hook-form, zod, @hookform/resolvers deps** — `app/package.json`
- [x] 2. **Build Form primitives** — `app/src/components/ui/form.tsx` (blocked by 1)
- [x] 3. **Add contact i18n strings (uk/ru/en)** — `app/src/locales/{uk,ru,en}.json`

### Phase 2 — Страница

- [x] 4. **Build Contact page** — `app/src/pages/Contact.tsx` (blocked by 2, 3)

### Phase 3 — Wiring

- [x] 5. **Wire /contact route and nav link** — `app/src/App.tsx`, `app/src/components/Nav.tsx` (blocked by 4)
- [x] 6. **Mount Toaster in PublicLayout** — `app/src/components/PublicLayout.tsx` (blocked by 4)

Полные описания задач с точными сигнатурами и требованиями — в списке задач (`TaskList` / `/tasks`), задачи #1–#6.

## Commit Plan

- **Commit 1** (после задач 1–3): `chore(contact): add react-hook-form/zod deps, Form primitives, and i18n strings`
- **Commit 2** (после задачи 4): `feat(contact): add contact page with client-side validation`
- **Commit 3** (после задач 5–6): `feat(contact): wire /contact route, nav link, and public toast host`

## Критерий готовности (для этого плана, не для всего Этапа 4)

Открыть `/#/uk/contact` (и `/ru/contact`, `/en/contact`) — форма отображается, лейблы/плейсхолдеры локализованы. Пустой сабмит показывает ошибки валидации под полями (мин. длина имени/сообщения, формат email) без перезагрузки страницы. Валидный сабмит показывает toast об успехе и логирует payload в консоль (`[pages/Contact] submit (stub, no backend yet)`) — реального сетевого запроса нет (проверить вкладку Network — запросов быть не должно). Пункт «Контакти»/«Контакты»/«Contact» появился в навигации на всех трёх локалях.

## Follow-up (вне этого плана)

Apps Script relay + Telegram-бот + honeypot rate-limit (CacheService) + защита токена бота — отдельный план, когда пользователь решит продолжить Этап 4.
