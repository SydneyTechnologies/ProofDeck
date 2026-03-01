# ProofDeck

Open-source, AI-optional technical slide platform with BYOK model support.

## Product Direction

ProofDeck is designed around a strict separation:

- Core editor is local-first and fully usable without AI.
- Intelligence layer is pluggable via provider adapters.
- Users bring their own keys/endpoints (OpenAI, Anthropic, Gemini, OpenAI-compatible local endpoints).

## Monorepo Layout

- `apps/web`: Vite + React technical slide editor MVP
- `packages/core`: deck schema, math symbol registry, deterministic lint rules
- `packages/ai`: model-agnostic AI provider contracts + AI SDK adapters
- `docs`: architecture and extension docs

## Current MVP Features

- Local-first slide editing with persistent Deck JSON (`localStorage`)
- Smart block types: text, math (KaTeX), graph
- Deterministic notation linting:
  - undefined symbols
  - duplicate definitions
  - unbalanced delimiters
- BYOK configuration UI
- AI SDK provider routing with encrypted local API key storage
- AI notation review and AI graph suggestion hooks

## Tech Stack

- Frontend: React + Vite + TypeScript + Zustand
- Math rendering: KaTeX
- AI layer: Vercel AI SDK (`ai`) + provider adapters
- Schemas: Zod

## Getting Started

### 1. Install dependencies

```bash
npm_config_cache=/tmp/npm-cache npm install
```

### 2. Run web app

```bash
npm run dev
```

### 3. Build all packages

```bash
npm run build
```

## Security Model (Current)

- API keys are never sent to ProofDeck servers.
- API keys are encrypted in browser local storage (AES-GCM via Web Crypto + passphrase-derived key).
- Key must be unlocked in-session via passphrase before AI calls.

## AI Provider Contract

The core AI provider interface is implemented in [`packages/ai/src/types/aiProvider.ts`](packages/ai/src/types/aiProvider.ts):

```ts
interface AIProvider {
  reviewNotation(deck: Deck): Promise<ReviewResult>;
  suggestGraph(equation: string): Promise<GraphSpec | null>;
  validateEquation(equation: string): Promise<ValidationResult>;
  formatCitation(input: string): Promise<Citation>;
}
```

## Next Recommended Milestones

1. Add plugin loader API for external provider/lint/citation modules.
2. Add collaboration and citation provider plugins.
3. Add desktop packaging (Tauri/Electron).
4. Add Dockerized self-host deployment profile.
