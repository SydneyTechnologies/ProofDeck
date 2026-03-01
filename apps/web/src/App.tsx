import { useEffect, useMemo, useState } from "react";
import { createProvider, type AIProvider, type ReviewResult } from "@proofdeck/ai";
import { createId, lintDeckNotation, type GraphSpec } from "@proofdeck/core";
import { AIReviewPanel } from "./components/AIReviewPanel";
import { LintPanel } from "./components/LintPanel";
import { ProviderSettings } from "./components/ProviderSettings";
import { SlideEditor } from "./components/SlideEditor";
import { SlideList } from "./components/SlideList";
import { SlidePreview } from "./components/SlidePreview";
import { useDeckStore } from "./hooks/useDeckStore";
import { decryptSecret, encryptSecret } from "./lib/secureStore";
import { DEFAULT_PROVIDER_SETTINGS, type ProviderSettings as ProviderSettingsType } from "./types/provider";

const PROVIDER_SETTINGS_KEY = "proofdeck.provider.settings.v1";
const PROVIDER_SECRET_KEY = "proofdeck.provider.secret.v1";

function loadProviderSettings(): ProviderSettingsType {
  const raw = localStorage.getItem(PROVIDER_SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_PROVIDER_SETTINGS;
  }

  try {
    return {
      ...DEFAULT_PROVIDER_SETTINGS,
      ...JSON.parse(raw)
    };
  } catch {
    return DEFAULT_PROVIDER_SETTINGS;
  }
}

export function App() {
  const deck = useDeckStore((state) => state.deck);
  const selectedSlideId = useDeckStore((state) => state.selectedSlideId);
  const setDeckTitle = useDeckStore((state) => state.setDeckTitle);
  const selectSlide = useDeckStore((state) => state.selectSlide);
  const addSlide = useDeckStore((state) => state.addSlide);
  const updateSlideTitle = useDeckStore((state) => state.updateSlideTitle);
  const addBlock = useDeckStore((state) => state.addBlock);
  const updateTextBlock = useDeckStore((state) => state.updateTextBlock);
  const updateMathBlock = useDeckStore((state) => state.updateMathBlock);
  const addGraphBlockFromSpec = useDeckStore((state) => state.addGraphBlockFromSpec);
  const removeBlock = useDeckStore((state) => state.removeBlock);

  const [providerSettings, setProviderSettings] = useState<ProviderSettingsType>(loadProviderSettings);
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(Boolean(localStorage.getItem(PROVIDER_SECRET_KEY)));
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [equation, setEquation] = useState("y = x^2");

  const selectedSlide = useMemo(() => deck.slides.find((slide) => slide.id === selectedSlideId), [deck.slides, selectedSlideId]);
  const lintReport = useMemo(() => lintDeckNotation(deck), [deck]);

  useEffect(() => {
    localStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify(providerSettings));
  }, [providerSettings]);

  useEffect(() => {
    if (!selectedSlideId && deck.slides[0]) {
      selectSlide(deck.slides[0].id);
    }
  }, [deck.slides, selectSlide, selectedSlideId]);

  const provider: AIProvider | null = useMemo(() => {
    if (providerSettings.mode === "mock") {
      return createProvider({ mode: "mock" });
    }

    if (!apiKey) {
      return null;
    }

    return createProvider({
      mode: "ai-sdk",
      config: {
        kind: providerSettings.kind,
        model: providerSettings.model,
        apiKey,
        temperature: providerSettings.temperature,
        baseURL: providerSettings.baseURL || undefined,
        providerName: providerSettings.providerName || "custom"
      }
    });
  }, [apiKey, providerSettings]);

  async function runReview(): Promise<void> {
    if (!provider) {
      setAiError("Provider is not ready. Unlock key or choose local mode.");
      return;
    }

    try {
      setBusy(true);
      setAiError(null);
      const result = await provider.reviewNotation(deck);
      setReview(result);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI review failed.");
    } finally {
      setBusy(false);
    }
  }

  async function suggestGraph(): Promise<void> {
    if (!provider) {
      setAiError("Provider is not ready. Unlock key or choose local mode.");
      return;
    }

    if (!selectedSlide) {
      setAiError("Select a slide before adding graph suggestions.");
      return;
    }

    try {
      setBusy(true);
      setAiError(null);
      const spec = await provider.suggestGraph(equation);
      if (!spec) {
        setAiError("No graph suggestion returned.");
        return;
      }

      const normalizedSpec: GraphSpec = {
        id: spec.id || createId("graph"),
        type: spec.type,
        title: spec.title || `Suggested: ${equation}`,
        x: spec.x,
        y: spec.y
      };

      addGraphBlockFromSpec(selectedSlide.id, normalizedSpec);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Graph suggestion failed.");
    } finally {
      setBusy(false);
    }
  }

  async function storeKey(nextApiKey: string, passphrase: string): Promise<void> {
    const encrypted = await encryptSecret(nextApiKey, passphrase);
    localStorage.setItem(PROVIDER_SECRET_KEY, encrypted);
    setApiKey(nextApiKey);
    setHasStoredKey(true);
  }

  async function unlockKey(passphrase: string): Promise<void> {
    const encrypted = localStorage.getItem(PROVIDER_SECRET_KEY);
    if (!encrypted) {
      throw new Error("No stored key found.");
    }

    const decrypted = await decryptSecret(encrypted, passphrase);
    setApiKey(decrypted);
  }

  const hasProviderReady = Boolean(provider);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Open Source • BYOK • AI Optional</p>
          <h1>ProofDeck</h1>
          <p className="hero-sub">Symbolic-aware slides with a pluggable intelligence layer.</p>
        </div>
        <div className="deck-title-wrap">
          <label className="field-label" htmlFor="deckTitleInput">
            Deck Title
          </label>
          <input
            id="deckTitleInput"
            className="input deck-title-input"
            value={deck.title}
            onChange={(event) => setDeckTitle(event.target.value)}
          />
        </div>
      </header>

      <main className="layout">
        <SlideList slides={deck.slides} selectedSlideId={selectedSlideId} onSelect={selectSlide} onAddSlide={addSlide} />

        <section className="editor-preview">
          <SlideEditor
            slide={selectedSlide}
            onSlideTitleChange={(title) => selectedSlide && updateSlideTitle(selectedSlide.id, title)}
            onAddTextBlock={() => selectedSlide && addBlock(selectedSlide.id, "text")}
            onAddMathBlock={() => selectedSlide && addBlock(selectedSlide.id, "math")}
            onAddGraphBlock={() => selectedSlide && addBlock(selectedSlide.id, "graph")}
            onTextChange={(blockId, value) => selectedSlide && updateTextBlock(selectedSlide.id, blockId, value)}
            onMathChange={(blockId, value) => selectedSlide && updateMathBlock(selectedSlide.id, blockId, value)}
            onRemoveBlock={(blockId) => selectedSlide && removeBlock(selectedSlide.id, blockId)}
          />
          <SlidePreview slide={selectedSlide} />
        </section>

        <section className="insights">
          <LintPanel deck={deck} report={lintReport} />
          <ProviderSettings
            settings={providerSettings}
            onChange={setProviderSettings}
            hasStoredKey={hasStoredKey}
            keyUnlocked={Boolean(apiKey)}
            onStoreKey={storeKey}
            onUnlockKey={unlockKey}
          />
          <AIReviewPanel
            providerReady={hasProviderReady}
            equation={equation}
            onEquationChange={setEquation}
            onRunReview={runReview}
            onSuggestGraph={suggestGraph}
            review={review}
            busy={busy}
            error={aiError}
          />
        </section>
      </main>
    </div>
  );
}
