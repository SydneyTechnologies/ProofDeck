import type { AIProvider } from "../types/aiProvider";
import { AISDKProvider, type AISDKProviderConfig } from "./aiSdkProvider";
import { MockProvider } from "./mockProvider";

export type ProviderConfig =
  | {
      mode: "mock";
    }
  | {
      mode: "ai-sdk";
      config: AISDKProviderConfig;
    };

export function createProvider(config: ProviderConfig): AIProvider {
  if (config.mode === "mock") {
    return new MockProvider();
  }

  return new AISDKProvider(config.config);
}
