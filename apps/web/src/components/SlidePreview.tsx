import { BlockMath } from "react-katex";
import type { Slide } from "@proofdeck/core";
import { GraphPreview } from "./GraphPreview";

interface SlidePreviewProps {
  slide: Slide | undefined;
}

export function SlidePreview({ slide }: SlidePreviewProps) {
  if (!slide) {
    return (
      <section className="panel">
        <h2>Preview</h2>
        <p className="muted">Select a slide to preview rendered output.</p>
      </section>
    );
  }

  return (
    <section className="panel preview-panel">
      <h2>Preview</h2>
      <h3>{slide.title}</h3>
      {slide.blocks.map((block) => {
        if (block.type === "text") {
          return (
            <p className="preview-text" key={block.id}>
              {block.text}
            </p>
          );
        }

        if (block.type === "math") {
          return (
            <div className="math-block" key={block.id}>
              <BlockMath math={block.latex} />
            </div>
          );
        }

        return (
          <div className="graph-block" key={block.id}>
            <p className="graph-title">{block.spec.title || "Graph"}</p>
            <GraphPreview spec={block.spec} />
          </div>
        );
      })}
    </section>
  );
}
