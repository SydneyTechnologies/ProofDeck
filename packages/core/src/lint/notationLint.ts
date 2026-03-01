import type { Deck } from "../schema/deck";
import { buildSymbolRegistry, extractSymbols, isBuiltinSymbol } from "../math/symbolRegistry";

export type IssueSeverity = "error" | "warning" | "info";

export interface LintIssue {
  id: string;
  code: "UNDEFINED_SYMBOL" | "DUPLICATE_DEFINITION" | "UNBALANCED_EXPRESSION";
  severity: IssueSeverity;
  message: string;
  symbol?: string;
  slideId: string;
  blockId: string;
}

export interface LintReport {
  issues: LintIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

function createIssueId(code: LintIssue["code"], slideId: string, blockId: string, symbol?: string): string {
  return [code, slideId, blockId, symbol].filter(Boolean).join(":");
}

function hasBalancedDelimiters(value: string): boolean {
  const pairs: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}"
  };
  const closing = new Set(Object.values(pairs));
  const stack: string[] = [];

  for (const char of value) {
    if (pairs[char]) {
      stack.push(char);
      continue;
    }

    if (closing.has(char)) {
      const last = stack.pop();
      if (!last || pairs[last] !== char) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

export function lintDeckNotation(deck: Deck): LintReport {
  const issues: LintIssue[] = [];
  const registry = buildSymbolRegistry(deck);

  for (const [symbol, locations] of Object.entries(registry.definitions)) {
    if (locations.length < 2) {
      continue;
    }

    for (const location of locations.slice(1)) {
      issues.push({
        id: createIssueId("DUPLICATE_DEFINITION", location.slideId, location.blockId, symbol),
        code: "DUPLICATE_DEFINITION",
        severity: "warning",
        message: `Symbol '${symbol}' is defined multiple times.`,
        symbol,
        slideId: location.slideId,
        blockId: location.blockId
      });
    }
  }

  for (const slide of deck.slides) {
    for (const block of slide.blocks) {
      if (block.type !== "math") {
        continue;
      }

      if (!hasBalancedDelimiters(block.latex)) {
        issues.push({
          id: createIssueId("UNBALANCED_EXPRESSION", slide.id, block.id),
          code: "UNBALANCED_EXPRESSION",
          severity: "error",
          message: "Equation has unbalanced delimiters.",
          slideId: slide.id,
          blockId: block.id
        });
      }

      const symbols = extractSymbols(block.latex);
      for (const symbol of symbols) {
        const isDefined = Boolean(registry.definitions[symbol]?.length);
        if (isDefined || isBuiltinSymbol(symbol)) {
          continue;
        }

        issues.push({
          id: createIssueId("UNDEFINED_SYMBOL", slide.id, block.id, symbol),
          code: "UNDEFINED_SYMBOL",
          severity: "warning",
          message: `Symbol '${symbol}' appears to be used before being defined.`,
          symbol,
          slideId: slide.id,
          blockId: block.id
        });
      }
    }
  }

  const summary = issues.reduce(
    (acc, issue) => {
      if (issue.severity === "error") {
        acc.errors += 1;
      } else if (issue.severity === "warning") {
        acc.warnings += 1;
      } else {
        acc.infos += 1;
      }
      return acc;
    },
    { errors: 0, warnings: 0, infos: 0 }
  );

  return { issues, summary };
}
