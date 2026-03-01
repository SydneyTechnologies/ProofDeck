import type { Citation, Deck, GraphSpec } from "@proofdeck/core";

export type AISeverity = "error" | "warning" | "info";

export interface AIReviewIssue {
  severity: AISeverity;
  message: string;
  slideId?: string;
  blockId?: string;
}

export interface ReviewResult {
  summary: string;
  issues: AIReviewIssue[];
}

export interface ValidationResult {
  valid: boolean;
  rationale: string;
  normalizedEquation?: string;
  warnings?: string[];
}

export interface ProviderMetadata {
  id: string;
  name: string;
  model: string;
}

export interface AIProvider {
  metadata: ProviderMetadata;
  reviewNotation(deck: Deck): Promise<ReviewResult>;
  suggestGraph(equation: string): Promise<GraphSpec | null>;
  validateEquation(equation: string): Promise<ValidationResult>;
  formatCitation(input: string): Promise<Citation>;
}
