# Deck JSON Schema (v1.0.0)

Top-level object:

- `version`: literal `"1.0.0"`
- `id`: deck ID
- `title`: deck title
- `createdAt`, `updatedAt`: ISO timestamps
- `slides`: list of slide objects
- `notationRegistry`: optional/derived symbol definitions
- `citations`: citation objects

Slide object:

- `id`
- `title`
- `blocks`

Block union:

- `text`: `{ id, type: "text", text }`
- `math`: `{ id, type: "math", latex, displayMode }`
- `graph`: `{ id, type: "graph", spec }`

Graph spec:

- `id`
- `type`: `line | scatter | bar`
- `title`
- `x: number[]`
- `y: number[]`

Source: `packages/core/src/schema/deck.ts`
