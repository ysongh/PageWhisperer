# PageWhisperer

A Chrome Extension built with React + TypeScript + Vite.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
```

This generates the extension files in the `dist/` folder.

## Load the Extension in Chrome

1. Run `pnpm build` to generate the `dist/` folder.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `dist/` folder from this project.
6. The extension icon will appear in the Chrome toolbar. Click it to open the popup.

### Reloading after changes

After making code changes:

1. Run `pnpm build` again.
2. Go to `chrome://extensions` and click the **reload** button (circular arrow) on the extension card.

## Project Structure

```
├── public/
│   └── manifest.json    # Chrome Extension manifest (v3)
├── src/                  # React application source
├── dist/                 # Build output (load this in Chrome)
├── vite.config.ts        # Vite configuration
└── package.json
```
