import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, type LanguageModel } from "ai";
import { createId, type Citation, type Deck, type GraphSpec } from "@proofdeck/core";
import { z } from "zod";
import type { AIProvider, ReviewResult, ValidationResult } from "../types/aiProvider";

export type AISDKProviderKind = "openai" | "anthropic" | "google" | "openai-compatible";

export interface AISDKProviderConfig {
  kind: AISDKProviderKind;
  apiKey: string;
  model: string;
  temperature?: number;
  baseURL?: string;
  providerName?: string;
  headers?: Record<string, string>;
}

const reviewIssueSchema = z.object({
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  slideId: z.string().optional(),
  blockId: z.string().optional()
});

const reviewResultSchema = z.object({
  summary: z.string(),
  issues: z.array(reviewIssueSchema)
});

const graphSpecSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["line", "scatter", "bar"]),
  title: z.string().optional(),
  x: z.array(z.number()),
  y: z.array(z.number())
});

const validationResultSchema = z.object({
  valid: z.boolean(),
  rationale: z.string(),
  normalizedEquation: z.string().optional(),
  warnings: z.array(z.string()).optional()
});

const citationSchema = z.object({
  key: z.string(),
  style: z.string(),
  raw: z.string(),
  formatted: z.string()
});

export class AISDKProvider implements AIProvider {
  readonly metadata;
  private readonly config: AISDKProviderConfig;

  constructor(config: AISDKProviderConfig) {
    this.config = config;
    this.metadata = {
      id: `ai-sdk:${config.kind}`,
      name: `AI SDK (${config.kind})`,
      model: config.model
    };
  }

  async reviewNotation(deck: Deck): Promise<ReviewResult> {
    const { object } = await generateObject({
      model: this.getModel(),
      schema: reviewResultSchema,
      temperature: this.config.temperature ?? 0.2,
      system:
        "You are a technical notation reviewer. Analyze mathematical notation consistency and clarity, then return only the requested JSON.",
      prompt: [
        "Review the following technical slide deck JSON for notation quality.",
        "Focus on ambiguous symbols, missing definitions, and inconsistent naming.",
        JSON.stringify(deck)
      ].join("\n\n")
    });

    return object;
  }

  async suggestGraph(equation: string): Promise<GraphSpec | null> {
    if (!equation.trim()) {
      return null;
    }

    const { object } = await generateObject({
      model: this.getModel(),
      schema: graphSpecSchema,
      temperature: this.config.temperature ?? 0.2,
      system:
        "You produce graph specs for technical slides. Prefer simple numeric arrays suitable for chart rendering.",
      prompt: `Suggest a graph spec for equation: ${equation}`
    });

    return {
      ...object,
      id: object.id ?? createId("graph")
    };
  }

  async validateEquation(equation: string): Promise<ValidationResult> {
    const { object } = await generateObject({
      model: this.getModel(),
      schema: validationResultSchema,
      temperature: this.config.temperature ?? 0.1,
      system: "You validate equation quality and notation correctness.",
      prompt: `Validate this equation and explain your result: ${equation}`
    });

    return object;
  }

  async formatCitation(input: string): Promise<Citation> {
    const { object } = await generateObject({
      model: this.getModel(),
      schema: citationSchema,
      temperature: this.config.temperature ?? 0.1,
      system: "You format technical citations and return structured JSON.",
      prompt: `Format this citation in a standard style: ${input}`
    });

    return {
      id: createId("citation"),
      ...object
    };
  }

  private getModel(): LanguageModel {
    switch (this.config.kind) {
      case "openai": {
        const provider = createOpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL
        });
        return provider(this.config.model);
      }
      case "anthropic": {
        const provider = createAnthropic({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL
        });
        return provider(this.config.model);
      }
      case "google": {
        const provider = createGoogleGenerativeAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL
        });
        return provider(this.config.model);
      }
      case "openai-compatible": {
        if (!this.config.baseURL) {
          throw new Error("baseURL is required for openai-compatible providers.");
        }
        const provider = createOpenAICompatible({
          name: this.config.providerName ?? "custom",
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL,
          headers: this.config.headers
        });
        return provider.chatModel(this.config.model);
      }
      default:
        throw new Error(`Unsupported provider kind: ${this.config.kind satisfies never}`);
    }
  }
}
