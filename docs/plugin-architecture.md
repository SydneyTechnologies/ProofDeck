# Plugin Architecture Spec (Initial)

## Goals

- Keep core editor stable.
- Allow independent extension of AI providers, lint rules, citation formatters, and graph engines.

## Extension Points

### AI Providers

Contract: `AIProvider` from `packages/ai/src/types/aiProvider.ts`

Expected capabilities:

- notation review
- graph suggestion
- equation validation
- citation formatting

### Lint Rules

Potential next contract:

```ts
interface LintPlugin {
  id: string;
  run(deck: Deck): LintIssue[];
}
```

### Citation Providers

Potential next contract:

```ts
interface CitationProvider {
  id: string;
  format(input: string, style: string): Promise<Citation>;
}
```

### Graph Engines

Potential next contract:

```ts
interface GraphEngine {
  id: string;
  render(spec: GraphSpec): RenderNode;
}
```

## Loading Strategy (Planned)

- Static local registration (current)
- Dynamic plugin registration API (next)
- Signed plugin bundles for hosted environments (future)
