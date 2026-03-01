import { useEffect, useMemo, useState } from "react";
import { createProvider, type AIProvider, type ReviewResult } from "@proofdeck/ai";
import { createId, lintDeckNotation, type BlockLayout, type GraphSpec } from "@proofdeck/core";
import { AIReviewPanel } from "./components/AIReviewPanel";
import { DeckHome } from "./components/DeckHome";
import { InspectorPanel } from "./components/InspectorPanel";
import { LintPanel } from "./components/LintPanel";
import { ProviderSettings } from "./components/ProviderSettings";
import { SlideCanvas } from "./components/SlideCanvas";
import { SlideRail } from "./components/SlideRail";
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

function clampLayout(layout: Partial<BlockLayout>): Partial<BlockLayout> {
  const next = { ...layout };
  if (typeof next.width === "number") {
    next.width = Math.max(80, Math.round(next.width));
  }
  if (typeof next.height === "number") {
    next.height = Math.max(60, Math.round(next.height));
  }
  if (typeof next.x === "number") {
    next.x = Math.max(0, Math.round(next.x));
  }
  if (typeof next.y === "number") {
    next.y = Math.max(0, Math.round(next.y));
  }
  return next;
}

export function App() {
  const decks = useDeckStore((state) => state.decks);
  const deck = useDeckStore((state) => state.deck);
  const activeDeckId = useDeckStore((state) => state.activeDeckId);
  const openDeck = useDeckStore((state) => state.openDeck);
  const createDeck = useDeckStore((state) => state.createDeck);
  const deleteDeck = useDeckStore((state) => state.deleteDeck);

  const selectedSlideId = useDeckStore((state) => state.selectedSlideId);
  const setDeckTitle = useDeckStore((state) => state.setDeckTitle);
  const selectSlide = useDeckStore((state) => state.selectSlide);
  const addSlide = useDeckStore((state) => state.addSlide);
  const updateSlideTitle = useDeckStore((state) => state.updateSlideTitle);
  const addBlock = useDeckStore((state) => state.addBlock);
  const updateBlockLayout = useDeckStore((state) => state.updateBlockLayout);
  const updateTextBlock = useDeckStore((state) => state.updateTextBlock);
  const updateMathBlock = useDeckStore((state) => state.updateMathBlock);
  const updateGraphSpec = useDeckStore((state) => state.updateGraphSpec);
  const addGraphBlockFromSpec = useDeckStore((state) => state.addGraphBlockFromSpec);
  const removeBlock = useDeckStore((state) => state.removeBlock);

  const [view, setView] = useState<"home" | "editor">("home");
  const [showInspector, setShowInspector] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<"design" | "review" | "ai" | "settings">("design");
  const [selectedBlockId, setSelectedBlockId] = useState("");

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

  useEffect(() => {
    if (!selectedSlide?.blocks.length) {
      setSelectedBlockId("");
      return;
    }

    const blockExists = selectedSlide.blocks.some((block) => block.id === selectedBlockId);
    if (!blockExists) {
      const firstBlock = selectedSlide.blocks[0];
      if (firstBlock) {
        setSelectedBlockId(firstBlock.id);
      }
    }
  }, [selectedBlockId, selectedSlide]);

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

  if (view === "home") {
    return (
      <DeckHome
        decks={decks}
        activeDeckId={activeDeckId}
        onOpenDeck={(deckId) => {
          openDeck(deckId);
          setView("editor");
        }}
        onCreateDeck={createDeck}
        onDeleteDeck={deleteDeck}
      />
    );
  }

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <div className="editor-brand">
          <p className="kicker">ProofDeck</p>
          <input
            className="editor-title-input"
            value={deck.title}
            onChange={(event) => setDeckTitle(event.target.value)}
            aria-label="Deck title"
          />
        </div>

        <div className="editor-topbar-actions">
          <button className="button" onClick={() => setView("home")}>
            All decks
          </button>
          <button className="button">Slideshow</button>
          <button className="button accent">Share</button>
        </div>
      </header>

      <nav className="editor-menubar" aria-label="Editor menu">
        {"File Edit View Insert Format Tools Extensions Help".split(" ").map((item) => (
          <button key={item} className="menu-btn" type="button">
            {item}
          </button>
        ))}
      </nav>

      <div className="editor-toolbar" role="toolbar" aria-label="Slide actions">
        <button className="button" onClick={addSlide}>
          + Slide
        </button>
        <span className="tool-divider" />
        <button className="button" onClick={() => selectedSlide && addBlock(selectedSlide.id, "text")}>
          Text
        </button>
        <button className="button" onClick={() => selectedSlide && addBlock(selectedSlide.id, "math")}>
          Math
        </button>
        <button className="button" onClick={() => selectedSlide && addBlock(selectedSlide.id, "graph")}>
          Graph
        </button>
        <span className="tool-divider" />
        <button className="button" onClick={() => setShowInspector((value) => !value)}>
          {showInspector ? "Hide panel" : "Show panel"}
        </button>
      </div>

      <main className={`editor-main ${showInspector ? "with-inspector" : ""}`}>
        <div className="editor-filmstrip">
          <SlideRail
            slides={deck.slides}
            selectedSlideId={selectedSlideId}
            onSelectSlide={selectSlide}
            onAddSlide={addSlide}
          />
        </div>

        <section className="editor-center">
          <div className="editor-canvas-meta">
            <h2>{selectedSlide?.title ?? "No slide selected"}</h2>
            <p className="muted">{selectedSlide ? `Slide ${deck.slides.findIndex((s) => s.id === selectedSlide.id) + 1}` : ""}</p>
          </div>

          <SlideCanvas
            slide={selectedSlide}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onMoveBlock={(blockId, layout) => {
              if (!selectedSlide) {
                return;
              }
              updateBlockLayout(selectedSlide.id, blockId, clampLayout(layout));
            }}
          />

          <div className="editor-notes">Click to add speaker notes</div>
        </section>

        {showInspector ? (
          <aside className="editor-inspector">
            <div className="inspector-tabbar">
              <button
                className={`tab-btn ${inspectorTab === "design" ? "active" : ""}`}
                onClick={() => setInspectorTab("design")}
              >
                Design
              </button>
              <button
                className={`tab-btn ${inspectorTab === "review" ? "active" : ""}`}
                onClick={() => setInspectorTab("review")}
              >
                Review
              </button>
              <button
                className={`tab-btn ${inspectorTab === "ai" ? "active" : ""}`}
                onClick={() => setInspectorTab("ai")}
              >
                AI
              </button>
              <button
                className={`tab-btn ${inspectorTab === "settings" ? "active" : ""}`}
                onClick={() => setInspectorTab("settings")}
              >
                Settings
              </button>
            </div>

            <div className="inspector-content">
              {inspectorTab === "design" ? (
                <InspectorPanel
                  slide={selectedSlide}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onSlideTitleChange={(title) => selectedSlide && updateSlideTitle(selectedSlide.id, title)}
                  onAddText={() => selectedSlide && addBlock(selectedSlide.id, "text")}
                  onAddMath={() => selectedSlide && addBlock(selectedSlide.id, "math")}
                  onAddGraph={() => selectedSlide && addBlock(selectedSlide.id, "graph")}
                  onUpdateText={(blockId, value) => selectedSlide && updateTextBlock(selectedSlide.id, blockId, value)}
                  onUpdateMath={(blockId, value) => selectedSlide && updateMathBlock(selectedSlide.id, blockId, value)}
                  onUpdateGraphSpec={(blockId, spec) => selectedSlide && updateGraphSpec(selectedSlide.id, blockId, spec)}
                  onUpdateLayout={(blockId, layout) =>
                    selectedSlide && updateBlockLayout(selectedSlide.id, blockId, clampLayout(layout))
                  }
                  onRemoveBlock={(blockId) => {
                    if (!selectedSlide) {
                      return;
                    }
                    removeBlock(selectedSlide.id, blockId);
                  }}
                />
              ) : null}

              {inspectorTab === "review" ? <LintPanel deck={deck} report={lintReport} /> : null}

              {inspectorTab === "ai" ? (
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
              ) : null}

              {inspectorTab === "settings" ? (
                <ProviderSettings
                  settings={providerSettings}
                  onChange={setProviderSettings}
                  hasStoredKey={hasStoredKey}
                  keyUnlocked={Boolean(apiKey)}
                  onStoreKey={storeKey}
                  onUnlockKey={unlockKey}
                />
              ) : null}
            </div>
          </aside>
        ) : null}
      </main>
    </div>
  );
}
