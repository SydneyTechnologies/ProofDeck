# ProofDeck Architecture

## Principles

1. Core editor works fully offline without AI.
2. AI is optional and replaceable.
3. Deck JSON is documented and stable.
4. Deterministic math checks run before LLM reasoning.

## Layers

### 1) Editor Layer (`apps/web`)

- Slide canvas/editor interactions
- Rendering for text/math/graphs
- Local persistence
- Provider/key configuration UX

### 2) Core Domain Layer (`packages/core`)

- Deck schema + validation
- Symbol extraction and notation registry
- Deterministic notation lint checks

### 3) AI Adapter Layer (`packages/ai`)

- `AIProvider` abstraction
- AI SDK-backed providers
- Mock local provider for no-AI workflows

## Processing Flow

1. User edits deck locally.
2. Deterministic lint runs on deck JSON.
3. If AI enabled and unlocked:
   - deck JSON is sent to selected provider through AI SDK
   - structured JSON response is parsed into internal result types
4. Results are merged into review panel and optional graph suggestions.

## Provider Modes

- `mock`: local deterministic behavior only
- `ai-sdk/openai`: direct OpenAI key
- `ai-sdk/anthropic`: direct Anthropic key
- `ai-sdk/google`: direct Gemini key
- `ai-sdk/openai-compatible`: BYO endpoint (Ollama, LM Studio, custom gateway)
