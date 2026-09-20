# Wooly documentation

Start with the [Chinese README](../README.md) or [English README](README.en.md). Current production runs Vite + React Router, one Cloudflare Worker, the existing D1 database and Cloudflare Access.

## Current references

| Document | Scope |
| --- | --- |
| [Development and deployment](08-development.md) | Local setup, test isolation, Access, CI/CD, deployment and releases |
| [Maintainer notes](10-maintainer-notes.md) | Current domain fields, MVVM, API, routes, UI and brand constraints |
| [Workers migration](11-workers-migration.md) | Accepted architecture, sibling-project comparison, v1.0.0 release evidence and owner cleanup |
| [AGENTS.md](../AGENTS.md) | Sole project handbook, exact checks and quality enforcement gaps |
| [Brand guide](../assets/brand/README.md) | Canonical logo, generated assets and reproduction |
| [Changelog](../CHANGELOG.md) | Versioned release history |
| [Retrospective](../Retrospective.md) | Incident narratives and follow-ups |

## Historical design records

These documents preserve the original designs, audits and completed plans. Their old paths, package versions, mock/auth workflows and checklists are not current execution instructions. Maintained source and the references above take precedence.

| Document | Historical scope | Current reference |
| --- | --- | --- |
| [01 — Data model](01-data-model.md) | Initial household entities and relationships | [Domain model](10-maintainer-notes.md#domain-model) |
| [02 — MVVM](02-mvvm-architecture.md) | Original Next.js layer and directory design | [Architecture](10-maintainer-notes.md#architecture) |
| [03 — Pages and UI](03-pages-and-ui.md) | Initial layouts and interaction sketches | [Pages](10-maintainer-notes.md#pages) |
| [04 — Mock data](04-mock-data.md) | Fixture scenarios and sample calculations | [Test resources](08-development.md#test-resources) |
| [05 — Cycle engine](05-cycle-engine.md) | Algorithm design and boundary examples | [Cycle system](10-maintainer-notes.md#cycle-system) |
| [06 — Implementation plan](06-implementation-plan.md) | Original MVP milestones | [Completed migration](11-workers-migration.md) |
| [07 — UI audit](07-ui-design-audit.md) | June 2026 comparison with Pew and visual changes | [Design system](10-maintainer-notes.md#design-system) |
| [09 — Basalt migration](09-basalt-component-migration.md) | Completed public-component migration before v1 | [Design system](10-maintainer-notes.md#design-system) |
| [Visual archive](visual/README.md) | Earlier screenshots and their limitations | [Current browser tests](../e2e/bdd/app.spec.ts) |
