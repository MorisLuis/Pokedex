# DearDoc Pokédex

Initial npm Workspaces scaffold. Pokémon functionality is intentionally not implemented.

## Requirements

Use Node.js 22.23.1 (`nvm use`) and npm. The supported Node range is 22.13+ within Node 22, or Node 24+; the shell's Node 18 is too old for the selected tools.

## Getting started

```sh
nvm use
npm install
npm run dev
```

The React client runs at http://localhost:5173 and the Express API at http://localhost:3001. Vite forwards `/api` requests to port 3001 during development.

No environment file is required. To override the API port, copy `server/.env.example` to `server/.env` and change `PORT`. If changing the API port, also update the development proxy in `client/vite.config.ts`. Node loads the server's optional `.env` file without dotenv.

## Commands

Run these from the repository root:

- `npm run dev`: run both applications with concurrently; stop both with Ctrl+C.
- `npm run typecheck`: check both workspaces without emitting files.
- `npm run lint`: lint TypeScript source and configuration using ESLint recommended rules.
- `npm run build`: type check and build the client into `client/dist`, then compile the server into `server/dist`.
- `npm run start --workspace server`: run the compiled API after building.
- `npm run preview --workspace client`: preview the built client locally.

`GET /api/health` returns HTTP 200 with `{"status":"ok"}`.

The Vite proxy is development-only. Serving the built client alongside the API requires deployment routing for `/api`; production hosting is outside this scaffold.

## Structure

- `client/`: React, Vite, and TypeScript, with a placeholder page.
- `server/`: Node.js, Express, and TypeScript, with a health endpoint.
- `tsconfig.base.json`: shared strict TypeScript settings; each workspace selects its own module resolution and output settings.
- `eslint.config.js`: minimal shared flat ESLint configuration for TypeScript.

Both workspaces use ES modules. Shared development tooling lives at the root; application dependencies and their types live in their respective workspaces. The root lockfile records exact resolved dependencies; use `npm ci` for repeatable installs.
