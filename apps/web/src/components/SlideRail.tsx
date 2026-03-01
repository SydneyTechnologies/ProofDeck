import type { Slide } from "@proofdeck/core";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./SlideCanvas";

interface SlideRailProps {
  slides: Slide[];
  selectedSlideId: string;
  onSelectSlide: (slideId: string) => void;
  onAddSlide: () => void;
}

function getBlockTone(type: Slide["blocks"][number]["type"]): string {
  if (type === "text") {
    return "var(--tone-text)";
  }
  if (type === "math") {
    return "var(--tone-math)";
  }
  return "var(--tone-graph)";
}

export function SlideRail({ slides, selectedSlideId, onSelectSlide, onAddSlide }: SlideRailProps) {
  return (
    <aside className="slide-rail">
      <div className="slide-rail-header">
        <h2>Slides</h2>
        <button className="button accent" onClick={onAddSlide}>
          +
        </button>
      </div>

      <ol className="slide-thumbnail-list">
        {slides.map((slide, index) => (
          <li key={slide.id}>
            <button
              className={`slide-thumbnail ${selectedSlideId === slide.id ? "active" : ""}`}
              onClick={() => onSelectSlide(slide.id)}
            >
              <span className="slide-thumb-label">{index + 1}</span>
              <div className="slide-thumb-canvas">
                {slide.blocks.map((block) => (
                  <span
                    key={block.id}
                    className="slide-thumb-block"
                    style={{
                      left: `${(block.layout.x / CANVAS_WIDTH) * 100}%`,
                      top: `${(block.layout.y / CANVAS_HEIGHT) * 100}%`,
                      width: `${(block.layout.width / CANVAS_WIDTH) * 100}%`,
                      height: `${(block.layout.height / CANVAS_HEIGHT) * 100}%`,
                      backgroundColor: getBlockTone(block.type)
                    }}
                  />
                ))}
              </div>
              <span className="slide-thumb-title">{slide.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
