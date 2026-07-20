# Implementation Plan: CommitsSection 2 колонки + подсветка активного пункта в Footer

Branch: main (no branch created — fast mode)
Created: 2026-07-20

## Settings
- Testing: no
- Logging: minimal (визуальные CSS/JSX-правки, без новых console.*)
- Docs: no

## Roadmap Linkage
Milestone: "none"
Rationale: Пропущено пользователем — точечные UI-правки, не относятся к вехам ROADMAP.md.

## Tasks

### Phase 1: UI-правки (независимые друг от друга)
- [x] Task 1: CommitsSection: 2 колонки на десктопе
  - Файл: `app/src/pages/Home/CommitsSection/index.tsx`
  - Контейнер списка коммитов: `flex flex-col` → `grid grid-cols-1 md:grid-cols-2`
  - Разделитель между колонками: `md:[&:nth-child(even)]:border-l md:[&:nth-child(even)]:border-border`
  - Убрать нижнюю границу у последней строки в обеих колонках:
    `md:[&:nth-last-child(-n+2)]:border-b-0` (корректно работает и при нечётном числе коммитов —
    последние 2 элемента в DOM-порядке всегда являются низом левой и правой колонки при
    построчном заполнении grid)
  - Мобильное поведение (`<md`) не менять — одна колонка, текущий `last:border-b-0` остаётся
  - CommitActivityGrid (тепловая карта) и CommandLabel не трогать — меняется только контейнер
    списка коммитов
  - Референс текущего вида (до изменения): `screens/image.png`
  - Проверить визуально на ширинах `>=768px` и `<768px`

- [x] Task 2: Footer: подсветка активного пункта меню
  - Файл: `app/src/shared/Footer/index.tsx`
  - Заменить `Link` на `NavLink` (react-router-dom), использовать уже существующее поле
    `link.end` из массива `links` (сейчас не используется)
  - `className={({ isActive }) => cn(..., isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground hover:underline')}`
  - Паттерн уже реализован в `app/src/shared/Nav/index.tsx` — скопировать оттуда (включая
    использование `cn()` из `@/lib/utils`)
  - Остальную вёрстку футера (структуру, отступы, остальные блоки) не менять
  - Проверить визуально: на Home подсвечен "Home", на /projects — "Projects", и т.д.

## Commit Plan
Задач меньше 5 — один коммит в конце, например:
`feat(ui): 2-column commits list on desktop and active nav highlight in footer`
