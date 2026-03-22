# CLAUDE.md

## Project Overview

PageWhisperer is a Chrome Extension built with React, TypeScript, and Vite (Manifest V3). It reads and displays content (title, URL, body text) from the user's active browser tab.

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Bundler:** Vite 7
- **Package Manager:** pnpm
- **Linting:** ESLint with TypeScript and React plugins
- **Chrome APIs:** `chrome.tabs`, `chrome.scripting` (Manifest V3)
- **Types:** `@types/chrome` for Chrome extension API typings

## Common Commands

- `pnpm install` — install dependencies
- `pnpm dev` — start dev server
- `pnpm build` — typecheck and build to `dist/`
- `pnpm lint` — run ESLint
- `pnpm preview` — preview production build

## Project Structure

- `public/manifest.json` — Chrome Extension manifest (v3)
- `src/` — React application source
- `dist/` — build output (load this folder as unpacked extension in Chrome)
- `vite.config.ts` — Vite config with stable filenames for extension compatibility

## Build Notes

- Vite is configured with stable output filenames (no content hashes) so the extension manifest can reference them reliably.
- The `dist/` folder is the loadable extension directory for Chrome.
- Chrome types must be included in `tsconfig.app.json` `types` array alongside `vite/client`.
