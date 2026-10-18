# AGENTS.md — DearDoc Pokédex

## Project Context

This repository contains a take-home full-stack Pokédex application for DearDoc.

The official challenge README is the source of truth for product requirements.

Prioritize correctness, simplicity, maintainability, and verifiable functionality over unnecessary abstractions.

## Technology Stack

- Frontend: React, Vite, TypeScript.
- Backend: Node.js, Express, TypeScript.
- Package management: npm Workspaces.
- Validation: Zod.
- Data source: PokéAPI, accessed only through our backend.
- Persistence: Browser localStorage for favorites.
- Backend caching: In-memory cache.

Do not introduce additional frameworks, databases, Redis, authentication, Docker, or state-management libraries without explicit approval.

## Architecture

### Frontend

- Keep components focused on presentation and user interaction.
- Isolate HTTP requests in a small API service.
- Use hooks when they encapsulate meaningful reusable behavior.
- Keep search, sorting, and pagination synchronized with URL query parameters.
- Store favorites in localStorage.
- Handle loading, empty, and error states.
- Avoid unnecessary global state.

### Backend

Use a simple separation of responsibilities:

- **Routes:** HTTP handling and request validation.
- **Services:** Business logic, filtering, sorting, and pagination.
- **Cache:** PokéAPI communication, caching, and refresh behavior.
- **Middleware:** Centralized error handling.
- **Schemas:** Zod validation.

Keep route handlers thin. Do not create repository layers, abstract base classes, dependency-injection containers, or generic service frameworks.

### API Contracts

`GET /api/pokemon`

Supports search, sorting, and pagination.

`GET /api/pokemon/:nameOrId`

Returns Pokémon details required by the UI.

Maintain consistent response structures and HTTP status codes.

## Caching Rules

- Cache the complete Pokémon index in Node.js memory.
- Use a one-hour TTL with stale-while-revalidate behavior.
- Return stale data immediately while refreshing asynchronously.
- Deduplicate concurrent upstream requests.
- Apply a five-second upstream timeout.
- Preserve valid cached data when refresh fails.
- Fetch individual Pokémon details on demand.
- Do not introduce external caching infrastructure.

## Code Quality

- Use strict TypeScript.
- Avoid `any` unless explicitly justified.
- Prefer small, readable functions.
- Keep naming consistent.
- Handle expected failures explicitly.
- Avoid premature optimization.
- Do not add dependencies without explaining their purpose.
- Follow existing repository conventions.

## Testing and Verification

- Write focused tests for important behavior and failure scenarios.
- Mock external PokéAPI requests in automated tests.
- Run relevant tests, typecheck, lint, and build after changes.
- Never claim verification for commands that were not executed.
- Report known limitations.

## AI Development Workflow

- Implement only the scope explicitly requested in the current task.
- Inspect relevant existing code before editing.
- Do not redesign established architecture without approval.
- Explain significant technical decisions not covered by instructions.
- Review generated changes for unnecessary complexity.
- Do not create Git commits unless explicitly requested.
- Do not modify AI_USAGE.md unless explicitly requested.

At the end of each task, report:

1. Files created or modified.
2. Dependencies added and why.
3. Technical decisions made.
4. Tests and verification performed.
5. Known limitations or remaining issues.

## Guiding Principle

Build the simplest solution that fully satisfies the requirements and can be clearly explained during a technical interview.