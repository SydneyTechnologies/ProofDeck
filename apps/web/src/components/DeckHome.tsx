import { useMemo, useState } from "react";
import type { Deck } from "@proofdeck/core";
import { SlideSnapshot } from "./SlideSnapshot";

interface DeckHomeProps {
  decks: Deck[];
  activeDeckId: string;
  onOpenDeck: (deckId: string) => void;
  onCreateDeck: (title?: string) => string;
  onDeleteDeck: (deckId: string) => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function DeckHome({ decks, activeDeckId, onOpenDeck, onCreateDeck, onDeleteDeck }: DeckHomeProps) {
  const [query, setQuery] = useState("");

  const filteredDecks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return decks;
    }

    return decks.filter((deck) => deck.title.toLowerCase().includes(normalized));
  }, [decks, query]);

  return (
    <div className="deck-home-shell">
      <header className="deck-home-topbar">
        <div className="brand-lockup">
          <p className="kicker">ProofDeck</p>
          <h1>Decks</h1>
        </div>

        <div className="home-actions">
          <input
            className="input home-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search decks"
          />
          <button className="button accent" onClick={() => onOpenDeck(onCreateDeck("Untitled Deck"))}>
            New deck
          </button>
        </div>
      </header>

      <section className="home-new-row">
        <h2>Start a new presentation</h2>
        <button className="new-deck-tile" onClick={() => onOpenDeck(onCreateDeck("Untitled Deck"))}>
          <span className="new-deck-plus">+</span>
          <span>Blank deck</span>
        </button>
      </section>

      <section className="home-grid-section">
        <h2>Recent decks</h2>

        {filteredDecks.length === 0 ? (
          <p className="muted">No decks found.</p>
        ) : (
          <ul className="deck-grid">
            {filteredDecks.map((deck) => {
              const coverSlide = deck.slides[0];
              return (
                <li key={deck.id}>
                  <article className={`deck-card ${deck.id === activeDeckId ? "active" : ""}`}>
                    <button className="deck-cover" onClick={() => onOpenDeck(deck.id)}>
                      <div className="deck-cover-canvas">
                        <SlideSnapshot slide={coverSlide} />
                      </div>
                    </button>

                    <div className="deck-meta">
                      <button className="deck-title-btn" onClick={() => onOpenDeck(deck.id)}>
                        {deck.title}
                      </button>
                      <p className="muted mono">{deck.slides.length} slides • Updated {formatDate(deck.updatedAt)}</p>
                    </div>

                    <div className="deck-card-actions">
                      <button className="button" onClick={() => onOpenDeck(deck.id)}>
                        Open
                      </button>
                      <button
                        className="button ghost danger"
                        onClick={() => {
                          if (window.confirm(`Delete '${deck.title}'?`)) {
                            onDeleteDeck(deck.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
