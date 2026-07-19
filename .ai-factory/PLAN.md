# Implementation Plan: Досвід роботи (Work Experience) в About + оновлення skills.json

Branch: main (fast mode, без гілки)
Created: 2026-07-19

## Settings
- Testing: no (за узгодженням з користувачем — контент/UI фіча, аналогічно profile/skills, без юніт-тестів)
- Logging: n/a — у проєкті немає runtime-логера (статичний Vite/React сайт), нові компоненти логів не потребують
- Docs: no (warn-only) — README/ARCHITECTURE не описують окремо кожен розділ About, апдейт не обов'язковий

## Roadmap Linkage
Milestone: "none"
Rationale: контентна фіча поверх вже завершених етапів 6-7 (адмінка), не належить жодному незакритому пункту ROADMAP.md (єдиний відкритий — Етап 4 "Ліди", не пов'язаний)

## Research Context
Немає активного RESEARCH.md summary для цієї задачі — вимоги взято напряму з повідомлення користувача (перелік скілів + текст резюме WebforBiz).

## Context (для імплементера)
- `app/data/skills.json` вже містить усі перелічені категорії/скіли **точно як просив користувач**, окрім одного: категорія "Tools & DevOps" має пункт `"SEO"`, користувач хоче `"SEO (технічний)"`. Це єдина зміна в skills.json.
- У проєкті **немає** жодної концепції "досвід роботи" (перевірено: `src/types.ts`, `src/pages/About`, `data/`) — це нова фіча, не правка існуючого.
- Патерн для нової content-сутності в цій админці — WordPress-стиль registry (див. `ARCHITECTURE.md`): новий тип реєструється в `src/admin/lib/registry.ts` (data-редактор) і `src/admin/lib/navConfig.ts` (пункт сайдбару), а не гілка в `Admin.tsx`.
- Локалізований контент — завжди `Localized<T>` (`{ uk, ru?, en? }`), `uk` — обов'язкова базова мова (див. `src/types.ts:3`).
- Rich-text поля (списки обов'язків/досягнень, summary) рендеряться через `MarkdownContent` (`src/components/MarkdownContent`) на публічній сторінці і редагуються через `RichTextEditor`/`LocalizedField` (`richText` prop) в адмінці — той самий патерн, що й `profile.bio`.
- Збереження в адмінці йде через `useEditorData` + глобальну кнопку "Сохранить всё" (`AdminDraftContext`) — **не** треба свій Save-button у новому редакторі (див. `SkillsEditor`/`ProfileEditor` як референс).
- `experience.json` — масив (як `skills.json`), навіть для одного запису зараз, щоб не ламати схему коли з'явиться друга робота.

## Commit Plan
- **Commit 1** (after tasks 1-4): "feat(data): add work experience type/data, fix SEO skill label"
- **Commit 2** (after tasks 5-8): "feat(admin,about): add experience editor and render work experience on About page"

## Tasks

### Phase 1: Дата-шар
- [x] Task 1: Додати тип `Experience` в `src/types.ts`
- [x] Task 2: Створити `app/data/experience.json`
- [x] Task 3: Виправити `app/data/skills.json` (SEO → SEO (технічний))
- [x] Task 4: Додати `getExperience()` в `src/lib/data.ts` (depends on 1, 2)
<!-- Commit checkpoint: tasks 1-4 -->

### Phase 2: i18n + Admin + About
- [ ] Task 5: Додати i18n ключі (`about.experience`, `common.stack`) в `uk.json`/`ru.json`/`en.json`
- [ ] Task 6: Створити `src/admin/editors/ExperienceEditor/index.tsx` (depends on 1)
- [ ] Task 7: Зареєструвати редактор у `src/admin/lib/registry.ts` і `src/admin/lib/navConfig.ts` (depends on 6)
- [ ] Task 8: Відрендерити секцію Experience на `src/pages/About/index.tsx` (depends on 1, 4, 5)
<!-- Commit checkpoint: tasks 5-8 -->
