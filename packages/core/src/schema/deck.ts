import { z } from "zod";

export const graphTypeSchema = z.enum(["line", "scatter", "bar"]);

export const blockLayoutSchema = z.object({
  x: z.number().min(0).default(64),
  y: z.number().min(0).default(64),
  width: z.number().min(80).default(360),
  height: z.number().min(60).default(160)
});

export const graphSpecSchema = z.object({
  id: z.string(),
  type: graphTypeSchema,
  title: z.string().optional(),
  x: z.array(z.number()),
  y: z.array(z.number())
});

export const textBlockSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  text: z.string(),
  layout: blockLayoutSchema.default({
    x: 72,
    y: 64,
    width: 440,
    height: 150
  })
});

export const mathBlockSchema = z.object({
  id: z.string(),
  type: z.literal("math"),
  latex: z.string(),
  displayMode: z.boolean().default(true),
  layout: blockLayoutSchema.default({
    x: 96,
    y: 240,
    width: 380,
    height: 180
  })
});

export const graphBlockSchema = z.object({
  id: z.string(),
  type: z.literal("graph"),
  spec: graphSpecSchema,
  layout: blockLayoutSchema.default({
    x: 520,
    y: 110,
    width: 520,
    height: 300
  })
});

export const slideBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  mathBlockSchema,
  graphBlockSchema
]);

export const slideSchema = z.object({
  id: z.string(),
  title: z.string(),
  blocks: z.array(slideBlockSchema)
});

export const notationDefinitionSchema = z.object({
  symbol: z.string(),
  definedInSlideId: z.string(),
  definedInBlockId: z.string()
});

export const citationSchema = z.object({
  id: z.string(),
  key: z.string(),
  style: z.string(),
  raw: z.string(),
  formatted: z.string()
});

export const deckSchema = z.object({
  version: z.literal("1.0.0"),
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  slides: z.array(slideSchema),
  notationRegistry: z.array(notationDefinitionSchema).default([]),
  citations: z.array(citationSchema).default([])
});

export type GraphType = z.infer<typeof graphTypeSchema>;
export type BlockLayout = z.infer<typeof blockLayoutSchema>;
export type GraphSpec = z.infer<typeof graphSpecSchema>;
export type SlideBlock = z.infer<typeof slideBlockSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type Citation = z.infer<typeof citationSchema>;
export type Deck = z.infer<typeof deckSchema>;

export function validateDeck(input: unknown): Deck {
  return deckSchema.parse(input);
}

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyDeck(title = "Untitled Deck"): Deck {
  const now = new Date().toISOString();
  return {
    version: "1.0.0",
    id: createId("deck"),
    title,
    createdAt: now,
    updatedAt: now,
    slides: [
      {
        id: createId("slide"),
        title: "Introduction",
        blocks: [
          {
            id: createId("text"),
            type: "text",
            text: "Start writing your technical narrative here.",
            layout: {
              x: 72,
              y: 64,
              width: 440,
              height: 150
            }
          },
          {
            id: createId("math"),
            type: "math",
            latex: "x = y + z",
            displayMode: true,
            layout: {
              x: 96,
              y: 248,
              width: 380,
              height: 180
            }
          }
        ]
      }
    ],
    notationRegistry: [],
    citations: []
  };
}
