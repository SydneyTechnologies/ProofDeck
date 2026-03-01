import type { AISDKProviderKind } from "@proofdeck/ai";

export interface ProviderSettings {
  mode: "mock" | "ai-sdk";
  kind: AISDKProviderKind;
  model: string;
  baseURL: string;
  providerName: string;
  temperature: number;
}

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  mode: "mock",
  kind: "openai",
  model: "gpt-4o-mini",
  baseURL: "",
  providerName: "custom",
  temperature: 0.2
};
