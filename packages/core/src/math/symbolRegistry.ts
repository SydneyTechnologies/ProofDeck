import type { Deck } from "../schema/deck";

export interface SymbolDefinitionLocation {
  slideId: string;
  blockId: string;
}

export interface SymbolRegistry {
  definitions: Record<string, SymbolDefinitionLocation[]>;
  usages: Record<string, SymbolDefinitionLocation[]>;
}

const BUILTIN_SYMBOLS = new Set([
  "sin",
  "cos",
  "tan",
  "log",
  "ln",
  "exp",
  "pi",
  "alpha",
  "beta",
  "gamma",
  "delta",
  "theta",
  "mu",
  "sigma",
  "lambda"
]);

function stripLatexCommands(latex: string): string {
  return latex.replace(/\\[a-zA-Z]+/g, " ");
}

export function extractSymbols(latex: string): string[] {
  const stripped = stripLatexCommands(latex);
  const matches = stripped.match(/[A-Za-z]+(?:_[A-Za-z0-9]+)?/g) ?? [];
  return matches.filter((token) => !BUILTIN_SYMBOLS.has(token));
}

export function extractDefinition(latex: string): string | null {
  const stripped = stripLatexCommands(latex).trim();
  const match = stripped.match(/^([A-Za-z]+(?:_[A-Za-z0-9]+)?)\s*[:=]/);
  return match?.[1] ?? null;
}

export function buildSymbolRegistry(deck: Deck): SymbolRegistry {
  const registry: SymbolRegistry = {
    definitions: {},
    usages: {}
  };

  for (const slide of deck.slides) {
    for (const block of slide.blocks) {
      if (block.type !== "math") {
        continue;
      }

      const location = { slideId: slide.id, blockId: block.id };
      const definition = extractDefinition(block.latex);
      if (definition) {
        registry.definitions[definition] ??= [];
        registry.definitions[definition].push(location);
      }

      const symbols = extractSymbols(block.latex);
      for (const symbol of symbols) {
        registry.usages[symbol] ??= [];
        registry.usages[symbol].push(location);
      }
    }
  }

  return registry;
}

export function isBuiltinSymbol(symbol: string): boolean {
  return BUILTIN_SYMBOLS.has(symbol);
}
