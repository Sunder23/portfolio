# Project Rules

> Short, actionable rules and conventions for this project. Loaded automatically by /aif-implement.

## Rules

- Never use Playwright (including via `npx`) in this project — not for feature verification, not in tests, not in CI. For browser-driven UI verification, either ask the user to check manually (dev server already running) or use `chromium-cli` if available in the environment.
- This project has no Radix UI — all `components/ui/*` are built on `@base-ui/react`. Never add `@radix-ui/*` packages; build new UI primitives via composition/`cloneElement` instead of the Radix `Slot`/`asChild` pattern.
