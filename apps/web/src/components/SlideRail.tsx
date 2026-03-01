import type { Slide } from "@proofdeck/core";
import { SlideSnapshot } from "./SlideSnapshot";

interface SlideRailProps {
  slides: Slide[];
  selectedSlideId: string;
  onSelectSlide: (slideId: string) => void;
  onAddSlide: () => void;
}

export function SlideRail({ slides, selectedSlideId, onSelectSlide, onAddSlide }: SlideRailProps) {
  return (
    <aside className="slide-rail">
      <div className="slide-rail-toolbar">
        <button className="slide-rail-add" onClick={onAddSlide} aria-label="Add slide">
          +
        </button>
      </div>

      <ol className="slide-thumbnail-list">
        {slides.map((slide, index) => (
          <li key={slide.id} className="slide-row">
            <span className="slide-thumb-number">{index + 1}</span>
            <button
              className={`slide-thumbnail ${selectedSlideId === slide.id ? "active" : ""}`}
              onClick={() => onSelectSlide(slide.id)}
            >
              <div className="slide-thumb-canvas">
                <SlideSnapshot slide={slide} />
              </div>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
