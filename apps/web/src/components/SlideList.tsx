import type { Slide } from "@proofdeck/core";

interface SlideListProps {
  slides: Slide[];
  selectedSlideId: string;
  onSelect: (slideId: string) => void;
  onAddSlide: () => void;
}

export function SlideList({ slides, selectedSlideId, onSelect, onAddSlide }: SlideListProps) {
  return (
    <section className="panel slide-list-panel">
      <div className="panel-header">
        <h2>Slides</h2>
        <button className="button button-accent" onClick={onAddSlide}>
          + Slide
        </button>
      </div>
      <ul className="slide-list">
        {slides.map((slide, index) => (
          <li key={slide.id}>
            <button
              className={`slide-chip ${selectedSlideId === slide.id ? "active" : ""}`}
              onClick={() => onSelect(slide.id)}
            >
              <span className="slide-index">{index + 1}.</span>
              <span>{slide.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
