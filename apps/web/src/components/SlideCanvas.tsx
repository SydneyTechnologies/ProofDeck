import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { BlockMath } from "react-katex";
import type { CSSProperties } from "react";
import type { BlockLayout, Slide } from "@proofdeck/core";
import { GraphPreview } from "./GraphPreview";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

interface SlideCanvasProps {
  slide: Slide | undefined;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, layout: Partial<BlockLayout>) => void;
}

interface DraggableBlockProps {
  block: Slide["blocks"][number];
  selected: boolean;
  onSelectBlock: (blockId: string) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function DraggableBlock({ block, selected, onSelectBlock }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id
  });

  const style: CSSProperties = {
    left: block.layout.x,
    top: block.layout.y,
    width: block.layout.width,
    height: block.layout.height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 24 : selected ? 12 : 4
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`canvas-block canvas-block-${block.type} ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
      onMouseDown={() => onSelectBlock(block.id)}
      onTouchStart={() => onSelectBlock(block.id)}
    >
      <header className="canvas-block-handle" {...attributes} {...listeners}>
        <span>{block.type.toUpperCase()}</span>
        <span className="mono">drag</span>
      </header>

      <div className="canvas-block-content">
        {block.type === "text" ? <p>{block.text}</p> : null}
        {block.type === "math" ? <BlockMath math={block.latex} /> : null}
        {block.type === "graph" ? <GraphPreview spec={block.spec} /> : null}
      </div>
    </article>
  );
}

export function SlideCanvas({ slide, selectedBlockId, onSelectBlock, onMoveBlock }: SlideCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    })
  );

  if (!slide) {
    return (
      <section className="canvas-stage-empty">
        <p>Select or create a slide.</p>
      </section>
    );
  }
  const currentSlide = slide;

  function handleDragEnd(event: DragEndEvent): void {
    const blockId = String(event.active.id);
    const block = currentSlide.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    const nextX = clamp(block.layout.x + event.delta.x, 0, CANVAS_WIDTH - block.layout.width);
    const nextY = clamp(block.layout.y + event.delta.y, 0, CANVAS_HEIGHT - block.layout.height);

    onMoveBlock(block.id, {
      x: Math.round(nextX),
      y: Math.round(nextY)
    });
  }

  return (
    <section className="canvas-stage">
      <div className="canvas-surface-wrap">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="canvas-surface" role="presentation">
            {currentSlide.blocks.map((block) => (
              <DraggableBlock
                key={block.id}
                block={block}
                selected={selectedBlockId === block.id}
                onSelectBlock={onSelectBlock}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </section>
  );
}
