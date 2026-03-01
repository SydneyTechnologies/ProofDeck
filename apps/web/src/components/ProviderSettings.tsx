import { useState } from "react";
import type { ProviderSettings } from "../types/provider";

interface ProviderSettingsProps {
  settings: ProviderSettings;
  hasStoredKey: boolean;
  keyUnlocked: boolean;
  onChange: (settings: ProviderSettings) => void;
  onStoreKey: (apiKey: string, passphrase: string) => Promise<void>;
  onUnlockKey: (passphrase: string) => Promise<void>;
}

export function ProviderSettings({
  settings,
  hasStoredKey,
  keyUnlocked,
  onChange,
  onStoreKey,
  onUnlockKey
}: ProviderSettingsProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setField = <K extends keyof ProviderSettings>(field: K, value: ProviderSettings[K]) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <section className="panel">
      <h2>BYOK Provider</h2>

      <label className="field-label" htmlFor="modeSelect">
        Mode
      </label>
      <select
        id="modeSelect"
        className="input"
        value={settings.mode}
        onChange={(event) => setField("mode", event.target.value as ProviderSettings["mode"])}
      >
        <option value="mock">Local only (no external AI)</option>
        <option value="ai-sdk">AI SDK (BYOK)</option>
      </select>

      {settings.mode === "ai-sdk" && (
        <>
          <label className="field-label" htmlFor="kindSelect">
            Provider
          </label>
          <select
            id="kindSelect"
            className="input"
            value={settings.kind}
            onChange={(event) => setField("kind", event.target.value as ProviderSettings["kind"])}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google Gemini</option>
            <option value="openai-compatible">OpenAI Compatible (Ollama/LM Studio)</option>
          </select>

          <label className="field-label" htmlFor="modelInput">
            Model
          </label>
          <input
            id="modelInput"
            className="input mono"
            value={settings.model}
            onChange={(event) => setField("model", event.target.value)}
          />

          <label className="field-label" htmlFor="baseUrlInput">
            Base URL (optional unless OpenAI-compatible)
          </label>
          <input
            id="baseUrlInput"
            className="input mono"
            value={settings.baseURL}
            onChange={(event) => setField("baseURL", event.target.value)}
            placeholder="https://api.openai.com/v1"
          />

          <label className="field-label" htmlFor="providerNameInput">
            Provider Name
          </label>
          <input
            id="providerNameInput"
            className="input"
            value={settings.providerName}
            onChange={(event) => setField("providerName", event.target.value)}
            placeholder="openai-compatible"
          />

          <label className="field-label" htmlFor="temperatureInput">
            Temperature
          </label>
          <input
            id="temperatureInput"
            type="number"
            min={0}
            max={1}
            step={0.1}
            className="input"
            value={settings.temperature}
            onChange={(event) => setField("temperature", Number(event.target.value))}
          />

          <div className="key-manager">
            <label className="field-label" htmlFor="apiKeyInput">
              API Key
            </label>
            <input
              id="apiKeyInput"
              type="password"
              className="input mono"
              value={apiKeyInput}
              onChange={(event) => setApiKeyInput(event.target.value)}
              placeholder="sk-..."
            />

            <label className="field-label" htmlFor="passphraseInput">
              Local passphrase for encryption
            </label>
            <input
              id="passphraseInput"
              type="password"
              className="input"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Choose a passphrase"
            />

            <div className="toolbar">
              <button
                className="button"
                onClick={async () => {
                  setError(null);
                  if (!apiKeyInput || !passphrase) {
                    setError("API key and passphrase are required.");
                    return;
                  }

                  try {
                    setBusy(true);
                    await onStoreKey(apiKeyInput, passphrase);
                    setApiKeyInput("");
                  } catch {
                    setError("Unable to store API key.");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                Save Key
              </button>

              <button
                className="button"
                onClick={async () => {
                  setError(null);
                  if (!passphrase) {
                    setError("Passphrase is required to unlock key.");
                    return;
                  }

                  try {
                    setBusy(true);
                    await onUnlockKey(passphrase);
                  } catch {
                    setError("Unable to unlock key. Check passphrase.");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy || !hasStoredKey}
              >
                Unlock Key
              </button>
            </div>

            <p className="mono muted">
              Stored: {hasStoredKey ? "yes" : "no"} | Unlocked: {keyUnlocked ? "yes" : "no"}
            </p>
            {error ? <p className="status-error">{error}</p> : null}
          </div>
        </>
      )}
    </section>
  );
}
