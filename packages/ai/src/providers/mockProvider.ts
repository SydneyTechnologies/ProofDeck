import { createId, lintDeckNotation, type Citation, type Deck, type GraphSpec } from "@proofdeck/core";
import type { AIProvider, ReviewResult, ValidationResult } from "../types/aiProvider";

export class MockProvider implements AIProvider {
  readonly metadata = {
    id: "mock",
    name: "Mock Provider",
    model: "rule-and-template-v1"
  };

  async reviewNotation(deck: Deck): Promise<ReviewResult> {
    const lint = lintDeckNotation(deck);
    const issues = lint.issues.map((issue) => ({
      severity: issue.severity,
      message: issue.message,
      slideId: issue.slideId,
      blockId: issue.blockId
    }));

    const summary =
      issues.length === 0
        ? "No deterministic issues detected."
        : `Found ${lint.summary.errors} errors and ${lint.summary.warnings} warnings from deterministic checks.`;

    return { summary, issues };
  }

  async suggestGraph(equation: string): Promise<GraphSpec | null> {
    if (!equation.trim()) {
      return null;
    }

    const x = [-3, -2, -1, 0, 1, 2, 3];
    const y = x.map((value) => value ** 2);

    return {
      id: createId("graph"),
      type: "line",
      title: `Suggested graph for ${equation}`,
      x,
      y
    };
  }

  async validateEquation(equation: string): Promise<ValidationResult> {
    const balanced = equation.split("{").length === equation.split("}").length;
    return {
      valid: balanced,
      rationale: balanced ? "Balanced braces detected." : "Brace mismatch detected.",
      normalizedEquation: equation.trim()
    };
  }

  async formatCitation(input: string): Promise<Citation> {
    const normalized = input.trim();
    return {
      id: createId("citation"),
      key: normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "citation",
      style: "apa",
      raw: input,
      formatted: normalized
    };
  }
}
