import { BlockMath } from "react-katex";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Slide } from "@proofdeck/core";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./SlideCanvas";
import { GraphPreview } from "./GraphPreview";

interface SlideSnapshotProps {
  slide: Slide | undefined;
}

function normalizeTextStyle(style: Slide["blocks"][number] extends infer B
  ? B extends { type: "text"; style: infer S }
    ? S
    : never
  : never): CSSProperties {
  return {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    color: style.color,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign
  };
}

export function SlideSnapshot({ slide }: SlideSnapshotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateScale = () => {
      const nextScale = element.clientWidth / CANVAS_WIDTH;
      setScale(nextScale || 1);
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="slide-snapshot" ref={containerRef}>
      <div
        className="slide-snapshot-surface"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`
        }}
      >
        {slide?.blocks.map((block) => (
          <article
            key={block.id}
            className={`slide-snapshot-block slide-snapshot-block-${block.type}`}
            style={{
              left: block.layout.x,
              top: block.layout.y,
              width: block.layout.width,
              height: block.layout.height
            }}
          >
            <div className="slide-snapshot-content">
              {block.type === "text" ? (
                <p className="slide-snapshot-text" style={normalizeTextStyle(block.style)}>
                  {block.text}
                </p>
              ) : null}

              {block.type === "math" ? (
                <div className="slide-snapshot-math">
                  <BlockMath math={block.latex || "\\text{Math block}"} />
                </div>
              ) : null}

              {block.type === "graph" ? (
                <div className="slide-snapshot-graph">
                  <GraphPreview spec={block.spec} />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
