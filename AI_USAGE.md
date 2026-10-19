# AI Usage Disclosure

## 1. Overview

This project was developed using a **human-led, AI-assisted engineering workflow**.

I used ChatGPT as an engineering reviewer and planning assistant, and OpenAI Codex as a coding agent for implementation, testing, and documentation.

My goal was not to minimize the amount of AI-generated code, but to maintain ownership of the requirements, architecture, technical decisions, code review, and verification.

The workflow followed four stages:

1. **Requirements and design:** Analyze the challenge, establish acceptance criteria, discuss alternatives, and define implementation scope.
2. **Implementation:** Delegate scoped milestones to Codex with explicit requirements, constraints, and expected behavior.
3. **Review and iteration:** Inspect generated code, question technical decisions, and request targeted changes.
4. **Verification:** Run automated checks, manually exercise the application, and review documentation before submission.

## 2. AI Tools Used

| Tool | Model / Version | Usage |
|---|---|---|
| ChatGPT (OpenAI) | GPT-6 | Requirements analysis, architecture discussions, prompt drafting, technical explanations, and engineering review |
| OpenAI Codex | GPT-6.1 Sol | Project scaffolding, backend and frontend implementation, automated tests, refactoring, debugging assistance, and README drafting |

I also used ChatGPT to help structure the instructions provided to Codex.

The repository's `AGENTS.md` established persistent project conventions, while milestone-specific prompts defined individual implementation tasks.

## 3. Main Prompts and Iterations

The following are the main prompts and representative instructions used during development. Some are abbreviated for readability.

### 3.1 Requirements and architecture — ChatGPT

**Initial prompt:**

> Act as my senior full-stack engineering reviewer for the DearDoc take-home challenge. Use the repository README as the source of truth. Help me deliver a complete, simple, maintainable Pokedex before Monday, October 19, 2026.

The initial discussion established acceptance criteria and evaluated the technical scope.

**Iterations included:**

- Evaluating whether server-side pagination was worthwhile despite caching the full catalog.
- Discussing search and sorting using an in-memory Pokémon index.
- Choosing to construct official artwork URLs from Pokémon IDs.
- Removing generation filtering from the MVP.
- Including an on-demand Pokémon details dialog.
- Evaluating whether rate limiting and frontend query caching were necessary.
- Defining the backend and frontend separation of responsibilities.

### 3.2 Project setup — Codex

**Main implementation instructions (summary):**

> Set up an npm Workspaces monorepo with a React/Vite/TypeScript frontend and a Node.js/Express/TypeScript backend. Configure strict TypeScript, minimal ESLint, development/build scripts, and a health endpoint. Do not implement Pokémon functionality yet or introduce unnecessary infrastructure.

Codex generated the initial project configuration and reported successful installation, type checking, linting, building, and health endpoint verification.

Additional configuration decisions included ES modules, a shared TypeScript configuration, and a Vite development proxy.

### 3.3 Backend implementation — Codex

**Main implementation instructions (summary):**

> Implement a simple REST backend wrapping PokéAPI, with partial search, sorting, pagination, individual Pokémon details, Zod validation, centralized error handling, and focused automated tests. Use an in-memory stale-while-revalidate cache with a one-hour TTL, five-second upstream timeout, and concurrent request deduplication. Preserve valid cached data when refreshes fail.

**Iterations and review:**

- Evaluated the separation between PokéAPI communication and cache lifecycle management.
- Reviewed the shared in-flight Promise mechanism used for concurrent requests.
- Discussed dependency injection for testability, including injecting the HTTP fetch implementation.
- Evaluated Codex's choice of Node's native test runner instead of Jest.
- Considered adding a retry cooldown after failed cache refreshes but decided against additional complexity for this challenge.
- Reviewed the trade-offs of process-local caching and an unbounded details cache.

### 3.4 Frontend implementation — Codex

**Main implementation instructions (summary):**

> Implement a responsive React Pokédex with Pokémon cards, search, sorting, pagination, localStorage favorites, and a details dialog. Use CSS Modules, typed API services, typed custom hooks, and clearly documented hook behavior. Handle loading, empty, and error states. Avoid global state-management libraries and unnecessary dependencies.

**Iterations and review:**

- Selected a white/light background with colorful Pokémon-themed cards.
- Maintained a single-screen interface without sidebar navigation or unnecessary filters.
- Required explicitly typed API request parameters and response contracts.
- Required explicit parameter and return types for custom hooks.
- Required JSDoc for exported custom hooks.
- Reviewed component and CSS Module organization, favoring colocation of component-specific styles.
- Kept frontend state management lightweight using React, URL query parameters, and localStorage.

### 3.5 Testing and documentation

Codex generated automated tests and technical documentation.

I used ChatGPT to help review test results, understand implementation decisions, and organize this AI usage disclosure.

The README was drafted from the implemented repository, then reviewed for accuracy and consistency with actual functionality.

## 4. Technical Decisions and Ownership

| Decision | Origin and rationale |
|---|---|
| React, Node.js, Express, TypeScript | My stack choice, based on existing experience and the challenge requirements |
| npm Workspaces | AI-suggested organization, reviewed and accepted |
| In-memory Pokémon index | Joint discussion; avoids unnecessary repeated upstream requests |
| Stale-while-revalidate | Introduced by ChatGPT; I selected it because Pokémon catalog data changes infrequently and cached responses should remain available during refreshes |
| No Redis or database | Deliberate decision to avoid infrastructure unnecessary for the requirements |
| No rate limiting | Evaluated and omitted because it was not justified by the expected scope |
| Backend pagination | AI recommendation, accepted to limit payload size and browser rendering |
| Artwork URLs from Pokémon IDs | My proposal, avoiding individual detail requests just to obtain artwork |
| localStorage favorites | AI suggestion, accepted because cross-device persistence was not required |
| On-demand details dialog | My choice to enhance the user experience without loading all details upfront |
| No generation filter | My scope-reduction decision |
| Dependency injection | Codex implementation, reviewed for testability and controlled dependency creation |
| `node:test` | Codex choice; retained after evaluating it against Jest and the project's needs |
| Component-specific CSS Modules | Reviewed and organized around component ownership |
| Typed services, typed hooks, and hook JSDoc | Explicit requirements I provided for the frontend |

The intention was to choose solutions proportionate to the application rather than introduce architecture for hypothetical future requirements.

## 5. Human Review of AI-Generated Code

I reviewed the generated implementation with particular attention to:

- Cache behavior during cold loads, fresh reads, expired reads, and failed refreshes.
- Shared promises used to prevent duplicate upstream requests.
- Error handling, response validation, and timeouts.
- REST endpoint contracts and request validation.
- Separation of backend responsibilities.
- Dependency injection and mocking boundaries.
- Frontend state ownership, component organization, and typed service contracts.

Not every AI suggestion was accepted. For example, an additional retry cooldown for cache refresh failures was discussed but excluded to keep the implementation proportional to the challenge.

I also questioned the use of `node:test`, ultimately retaining it rather than introducing another dependency simply because Jest was more familiar.

These discussions helped ensure that I could explain the important implementation decisions rather than accepting generated code without review.

## 6. Verification

The following commands were executed successfully using Node.js 22.23.1:

```bash
npm run test --workspaces
npm run typecheck
npm run lint
npm run build
```

**Automated test results:**

| Area | Result |
|---|---|
| Backend | 28 passed, 0 failed |
| Frontend | 7 passed, 0 failed |
| Total | 35 passed, 0 failed |
| TypeScript | Passed |
| ESLint | Passed |
| Production build | Passed |

Backend tests cover caching, concurrency, stale refreshes, upstream failures, request validation, search, sorting, pagination, details, and error responses.

Frontend tests cover URL parameter handling, favorites storage parsing, typed API-service behavior, HTTP errors, and cancellation propagation.

Upstream requests are mocked in automated tests to avoid dependence on live PokéAPI availability.

I also manually checked the backend endpoints against live data and inspected the application in the browser.

**Verification limitation:** The current frontend automated tests do not comprehensively test rendered React components, hook effects, or browser interactions. Responsive behavior, dialog interactions, and accessibility require manual validation.

## 7. Known Limitations and Trade-offs

- In-memory caches are not shared across multiple backend instances and reset on restart.
- Stale catalog data can remain available when upstream refreshes fail.
- Individual Pokémon details are cached without an eviction policy.
- Favorites are stored per browser origin rather than synchronized across devices.
- The frontend uses lightweight React state management rather than a dedicated server-state library.
- The application does not include production hosting configuration.
- Some interactive frontend behavior relies on manual verification rather than browser automation.

These limitations were accepted to prioritize a complete, maintainable take-home application without unnecessary infrastructure.

## 8. Reflection

AI was most useful for accelerating implementation and providing a second perspective during architecture and code review.

The main engineering value came from defining constraints before generation, reviewing the resulting code, questioning additional complexity, and verifying behavior.

This workflow allowed me to focus on requirements, architectural trade-offs, integration correctness, and delivery quality while using AI to reduce repetitive implementation work.