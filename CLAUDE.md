# CLAUDE.md

## Project Overview

PageWhisperer is a Chrome Extension built with React, TypeScript, and Vite (Manifest V3). It reads content from the user's active browser tab and summarizes it using either cloud LLM APIs (Gemini, Claude, ChatGPT) or a local in-browser model via WebGPU (@mlc-ai/web-llm).

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Bundler:** Vite 7
- **Package Manager:** pnpm
- **Linting:** ESLint with TypeScript and React plugins
- **Chrome APIs:** `chrome.tabs`, `chrome.scripting`, `chrome.storage` (Manifest V3)
- **Local LLM:** `@mlc-ai/web-llm` for in-browser inference via WebGPU
- **Cloud LLMs:** Google Gemini, Anthropic Claude, OpenAI ChatGPT (via REST APIs)
- **Types:** `@types/chrome` for Chrome extension API typings

## Common Commands

- `pnpm install` — install dependencies
- `pnpm dev` — start dev server
- `pnpm build` — typecheck and build to `dist/`
- `pnpm lint` — run ESLint
- `pnpm preview` — preview production build

## Project Structure

- `public/manifest.json` — Chrome Extension manifest (v3)
- `src/App.tsx` — main UI component (state management and rendering)
- `src/lib/constants.ts` — provider/model definitions, types, system prompt
- `src/lib/storage.ts` — chrome.storage.local wrappers for persisting state
- `src/lib/pageExtractor.ts` — extracts page content from the active tab
- `src/lib/cloudProviders.ts` — cloud LLM summarization (Gemini, Claude, ChatGPT)
- `src/lib/localModel.ts` — local LLM loading and summarization via web-llm
- `dist/` — build output (load this folder as unpacked extension in Chrome)
- `vite.config.ts` — Vite config with stable filenames for extension compatibility

## Build Notes

- Vite is configured with stable output filenames (no content hashes) so the extension manifest can reference them reliably.
- The `dist/` folder is the loadable extension directory for Chrome.
- Chrome types must be included in `tsconfig.app.json` `types` array alongside `vite/client`.
