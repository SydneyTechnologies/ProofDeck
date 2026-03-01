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

const DECK_STORAGE_KEY = "proofdeck.deck.v1";

interface DeckState {
  deck: Deck;
  selectedSlideId: string;
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

function loadInitialDeck(): Deck {
  const persisted = localStorage.getItem(DECK_STORAGE_KEY);
  if (!persisted) {
    return createEmptyDeck("ProofDeck Demo");
  }

  try {
    return validateDeck(JSON.parse(persisted));
  } catch {
    return createEmptyDeck("ProofDeck Demo");
  }
}

function persistDeck(deck: Deck): void {
  localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
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

const initialDeck = loadInitialDeck();

export const useDeckStore = create<DeckState>((set) => ({
  deck: initialDeck,
  selectedSlideId: initialDeck.slides[0]?.id ?? "",
  setDeckTitle: (title) =>
    set((state) => {
      const next = withUpdatedTimestamp({
        ...state.deck,
        title
      });
      persistDeck(next);
      return { deck: next };
    }),
  selectSlide: (slideId) => set({ selectedSlideId: slideId }),
  addSlide: () =>
    set((state) => {
      const newSlide: Slide = {
        id: createId("slide"),
        title: `Slide ${state.deck.slides.length + 1}`,
        blocks: [defaultBlock("text")]
      };

      const next = withUpdatedTimestamp({
        ...state.deck,
        slides: [...state.deck.slides, newSlide]
      });
      persistDeck(next);

      return {
        deck: next,
        selectedSlideId: newSlide.id
      };
    }),
  updateSlideTitle: (slideId, title) =>
    set((state) => {
      const next = withUpdatedTimestamp(
        updateSlide(state.deck, slideId, (slide) => ({
          ...slide,
          title
        }))
      );
      persistDeck(next);
      return { deck: next };
    }),
  addBlock: (slideId, type) =>
    set((state) => {
      const next = withUpdatedTimestamp(
        updateSlide(state.deck, slideId, (slide) => ({
          ...slide,
          blocks: [...slide.blocks, defaultBlock(type)]
        }))
      );
      persistDeck(next);
      return { deck: next };
    }),
  updateBlockLayout: (slideId, blockId, layout) =>
    set((state) => {
      const next = withUpdatedTimestamp(
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
      persistDeck(next);
      return { deck: next };
    }),
  updateTextBlock: (slideId, blockId, text) =>
    set((state) => {
      const next = withUpdatedTimestamp(
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
      persistDeck(next);
      return { deck: next };
    }),
  updateMathBlock: (slideId, blockId, latex) =>
    set((state) => {
      const next = withUpdatedTimestamp(
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
      persistDeck(next);
      return { deck: next };
    }),
  updateGraphSpec: (slideId, blockId, spec) =>
    set((state) => {
      const next = withUpdatedTimestamp(
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
      persistDeck(next);
      return { deck: next };
    }),
  addGraphBlockFromSpec: (slideId, spec) =>
    set((state) => {
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

      const next = withUpdatedTimestamp(
        updateSlide(state.deck, slideId, (slide) => ({
          ...slide,
          blocks: [...slide.blocks, graphBlock]
        }))
      );
      persistDeck(next);
      return { deck: next };
    }),
  removeBlock: (slideId, blockId) =>
    set((state) => {
      const next = withUpdatedTimestamp(
        updateSlide(state.deck, slideId, (slide) => ({
          ...slide,
          blocks: slide.blocks.filter((block) => block.id !== blockId)
        }))
      );
      persistDeck(next);
      return { deck: next };
    })
}));
