import { create } from "zustand";
import {
  type BlockLayout,
  createEmptyDeck,
  createId,
  type Deck,
  type GraphSpec,
  type Slide,
  type SlideBlock,
  validateDeck
} from "@proofdeck/core";

const DECK_LIBRARY_STORAGE_KEY = "proofdeck.decks.v1";
const ACTIVE_DECK_ID_STORAGE_KEY = "proofdeck.activeDeckId.v1";
const LEGACY_DECK_STORAGE_KEY = "proofdeck.deck.v1";

interface DeckState {
  decks: Deck[];
  deck: Deck;
  activeDeckId: string;
  selectedSlideId: string;
  openDeck: (deckId: string) => void;
  createDeck: (title?: string) => string;
  deleteDeck: (deckId: string) => void;
  setDeckTitle: (title: string) => void;
  selectSlide: (slideId: string) => void;
  addSlide: () => void;
  updateSlideTitle: (slideId: string, title: string) => void;
  addBlock: (slideId: string, type: SlideBlock["type"]) => void;
  updateBlockLayout: (slideId: string, blockId: string, layout: Partial<BlockLayout>) => void;
  updateTextBlock: (slideId: string, blockId: string, text: string) => void;
  updateMathBlock: (slideId: string, blockId: string, latex: string) => void;
  updateGraphSpec: (slideId: string, blockId: string, spec: GraphSpec) => void;
  addGraphBlockFromSpec: (slideId: string, spec: GraphSpec) => void;
  removeBlock: (slideId: string, blockId: string) => void;
}

function defaultBlock(type: SlideBlock["type"]): SlideBlock {
  if (type === "text") {
    return {
      id: createId("text"),
      type: "text",
      text: "New text block",
      layout: {
        x: 72,
        y: 64,
        width: 440,
        height: 150
      }
    };
  }

  if (type === "math") {
    return {
      id: createId("math"),
      type: "math",
      latex: "a = b + c",
      displayMode: true,
      layout: {
        x: 96,
        y: 248,
        width: 380,
        height: 180
      }
    };
  }

  return {
    id: createId("graph"),
    type: "graph",
    spec: {
      id: createId("spec"),
      type: "line",
      title: "Sample Graph",
      x: [-2, -1, 0, 1, 2],
      y: [4, 1, 0, 1, 4]
    },
    layout: {
      x: 520,
      y: 110,
      width: 520,
      height: 300
    }
  };
}

function persistLibrary(decks: Deck[], activeDeckId: string): void {
  localStorage.setItem(DECK_LIBRARY_STORAGE_KEY, JSON.stringify(decks));
  localStorage.setItem(ACTIVE_DECK_ID_STORAGE_KEY, activeDeckId);
}

function loadLegacyDeck(): Deck | null {
  const legacy = localStorage.getItem(LEGACY_DECK_STORAGE_KEY);
  if (!legacy) {
    return null;
  }

  try {
    return validateDeck(JSON.parse(legacy));
  } catch {
    return null;
  }
}

function loadInitialState(): { decks: Deck[]; activeDeckId: string; selectedSlideId: string; deck: Deck } {
  const persistedDecks = localStorage.getItem(DECK_LIBRARY_STORAGE_KEY);
  let decks: Deck[] = [];

  if (persistedDecks) {
    try {
      const parsed = JSON.parse(persistedDecks) as unknown[];
      decks = parsed.map((item) => validateDeck(item));
    } catch {
      decks = [];
    }
  }

  if (decks.length === 0) {
    const legacyDeck = loadLegacyDeck();
    if (legacyDeck) {
      decks = [legacyDeck];
      localStorage.removeItem(LEGACY_DECK_STORAGE_KEY);
    }
  }

  if (decks.length === 0) {
    decks = [createEmptyDeck("ProofDeck Demo")];
  }

  const storedActiveDeckId = localStorage.getItem(ACTIVE_DECK_ID_STORAGE_KEY);
  const activeDeck = decks.find((item) => item.id === storedActiveDeckId) ?? decks[0];

  if (!activeDeck) {
    const fallbackDeck = createEmptyDeck("ProofDeck Demo");
    decks = [fallbackDeck];
    persistLibrary(decks, fallbackDeck.id);
    return {
      decks,
      activeDeckId: fallbackDeck.id,
      selectedSlideId: fallbackDeck.slides[0]?.id ?? "",
      deck: fallbackDeck
    };
  }

  persistLibrary(decks, activeDeck.id);
  return {
    decks,
    activeDeckId: activeDeck.id,
    selectedSlideId: activeDeck.slides[0]?.id ?? "",
    deck: activeDeck
  };
}

function withUpdatedTimestamp(deck: Deck): Deck {
  return {
    ...deck,
    updatedAt: new Date().toISOString()
  };
}

function updateSlide(deck: Deck, slideId: string, updater: (slide: Slide) => Slide): Deck {
  return {
    ...deck,
    slides: deck.slides.map((slide) => (slide.id === slideId ? updater(slide) : slide))
  };
}

function replaceDeckInLibrary(decks: Deck[], nextDeck: Deck): Deck[] {
  return decks.map((item) => (item.id === nextDeck.id ? nextDeck : item));
}

function createReplacementDeckTitle(decks: Deck[]): string {
  return `Untitled Deck ${decks.length + 1}`;
}

const initialState = loadInitialState();

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: initialState.decks,
  deck: initialState.deck,
  activeDeckId: initialState.activeDeckId,
  selectedSlideId: initialState.selectedSlideId,
  openDeck: (deckId) => {
    const state = get();
    const nextDeck = state.decks.find((item) => item.id === deckId);
    if (!nextDeck) {
      return;
    }

    persistLibrary(state.decks, nextDeck.id);
    set({
      activeDeckId: nextDeck.id,
      deck: nextDeck,
      selectedSlideId: nextDeck.slides[0]?.id ?? ""
    });
  },
  createDeck: (title) => {
    const state = get();
    const nextDeck = createEmptyDeck(title?.trim() || createReplacementDeckTitle(state.decks));
    const nextDecks = [nextDeck, ...state.decks];

    persistLibrary(nextDecks, nextDeck.id);
    set({
      decks: nextDecks,
      deck: nextDeck,
      activeDeckId: nextDeck.id,
      selectedSlideId: nextDeck.slides[0]?.id ?? ""
    });

    return nextDeck.id;
  },
  deleteDeck: (deckId) => {
    const state = get();
    const remaining = state.decks.filter((item) => item.id !== deckId);

    if (remaining.length === 0) {
      const fallback = createEmptyDeck("ProofDeck Demo");
      persistLibrary([fallback], fallback.id);
      set({
        decks: [fallback],
        deck: fallback,
        activeDeckId: fallback.id,
        selectedSlideId: fallback.slides[0]?.id ?? ""
      });
      return;
    }

    const nextActiveDeck = remaining.find((item) => item.id === state.activeDeckId) ?? remaining[0];
    if (!nextActiveDeck) {
      return;
    }

    persistLibrary(remaining, nextActiveDeck.id);
    set({
      decks: remaining,
      deck: nextActiveDeck,
      activeDeckId: nextActiveDeck.id,
      selectedSlideId: nextActiveDeck.slides[0]?.id ?? ""
    });
  },
  setDeckTitle: (title) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp({
      ...state.deck,
      title
    });
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  selectSlide: (slideId) => set({ selectedSlideId: slideId }),
  addSlide: () => {
    const state = get();
    const newSlide: Slide = {
      id: createId("slide"),
      title: `Slide ${state.deck.slides.length + 1}`,
      blocks: [defaultBlock("text")]
    };

    const nextDeck = withUpdatedTimestamp({
      ...state.deck,
      slides: [...state.deck.slides, newSlide]
    });
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({
      deck: nextDeck,
      decks: nextDecks,
      selectedSlideId: newSlide.id
    });
  },
  updateSlideTitle: (slideId, title) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        title
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  addBlock: (slideId, type) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        blocks: [...slide.blocks, defaultBlock(type)]
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  updateBlockLayout: (slideId, blockId, layout) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        blocks: slide.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                layout: {
                  ...block.layout,
                  ...layout
                }
              }
            : block
        )
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  updateTextBlock: (slideId, blockId, text) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        blocks: slide.blocks.map((block) =>
          block.id === blockId && block.type === "text"
            ? {
                ...block,
                text
              }
            : block
        )
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  updateMathBlock: (slideId, blockId, latex) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        blocks: slide.blocks.map((block) =>
          block.id === blockId && block.type === "math"
            ? {
                ...block,
                latex
              }
            : block
        )
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  updateGraphSpec: (slideId, blockId, spec) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        blocks: slide.blocks.map((block) =>
          block.id === blockId && block.type === "graph"
            ? {
                ...block,
                spec
              }
            : block
        )
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  addGraphBlockFromSpec: (slideId, spec) => {
    const state = get();
    const graphBlock: SlideBlock = {
      id: createId("graph"),
      type: "graph",
      spec: {
        ...spec,
        id: spec.id || createId("spec")
      },
      layout: {
        x: 520,
        y: 110,
        width: 520,
        height: 300
      }
    };

    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        blocks: [...slide.blocks, graphBlock]
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  },
  removeBlock: (slideId, blockId) => {
    const state = get();
    const nextDeck = withUpdatedTimestamp(
      updateSlide(state.deck, slideId, (slide) => ({
        ...slide,
        blocks: slide.blocks.filter((block) => block.id !== blockId)
      }))
    );
    const nextDecks = replaceDeckInLibrary(state.decks, nextDeck);

    persistLibrary(nextDecks, nextDeck.id);
    set({ deck: nextDeck, decks: nextDecks });
  }
}));
