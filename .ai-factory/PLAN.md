# Implementation Plan: Reorganize layouts folders (admin + public)

Branch: main (no branch created — fast mode)
Created: 2026-07-20

## Settings
- Testing: no new tests — only update existing import paths in *.test.tsx
- Logging: n/a — structural file move, no runtime logic changes
- Docs: no

## Roadmap Linkage
Milestone: "none"
Rationale: Skipped by user — internal folder-structure refactor, not tied to a specific roadmap milestone.

## Scope

Two independent folder moves + rename, confirmed with user:

1. `app/src/admin/components/AdminLayout/*` → `app/src/admin/layouts/*`
   (admin/layouts becomes a sibling of admin/components)
2. `app/src/components/layouts/PublicLayout` → `app/src/layouts/PublicLayout`
   (src/layouts becomes a sibling of src/components)

All known references found via grep across `app/src`:
- `app/src/pages/Admin/index.tsx:4` — `import AdminLayout from '@/admin/components/AdminLayout'`
- `app/src/admin/editors/ProjectForm/ProjectForm.test.tsx:8` — `import { SaveAllButton } from '@/admin/components/AdminLayout/SaveAllButton'`
- `app/src/admin/editors/ProjectsList/ProjectsList.test.tsx:8` — same SaveAllButton import
- `app/src/App.tsx:12` — `import { PublicLayout } from '@/components/layouts/PublicLayout'`
- `app/src/index.css:133` — comment referencing `app/src/components/layouts/PublicLayout`

No conflicting `admin/layouts` or `src/layouts` directories currently exist.

## Tasks

### Phase 1: Move folders (independent, can be done in either order)
- [x] Task 1: Move `admin/components/AdminLayout` → `admin/layouts`, update its 3 import sites
- [x] Task 2: Move `components/layouts/PublicLayout` → `src/layouts/PublicLayout`, update its 2 references, remove empty `components/layouts` dir

### Phase 2: Verification
- [x] Task 3: Run `npm run build`, `npm run lint`, `npm test` in `app/` (depends on 1, 2); fix any stale paths surfaced — build and lint pass clean; 95/96 tests pass, the 1 failure (Footer.test.tsx react-router context error) is pre-existing and unrelated, confirmed via git stash comparison against unmodified code

## Commit Plan
Fewer than 5 tasks — single commit at the end:
- `refactor(structure): move AdminLayout to admin/layouts and PublicLayout to src/layouts`
