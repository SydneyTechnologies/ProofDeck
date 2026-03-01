import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { BlockMath } from "react-katex";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { BlockLayout, Slide } from "@proofdeck/core";
import { GraphPreview } from "./GraphPreview";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

interface SlideCanvasProps {
  slide: Slide | undefined;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, layout: Partial<BlockLayout>) => void;
  onUpdateText: (blockId: string, value: string) => void;
}

interface DraggableBlockProps {
  block: Slide["blocks"][number];
  selected: boolean;
  editingText: boolean;
  scale: number;
  onSelectBlock: (blockId: string) => void;
  onStartTextEdit: (blockId: string) => void;
  onStopTextEdit: () => void;
  onUpdateText: (blockId: string, value: string) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

function DraggableBlock({
  block,
  selected,
  editingText,
  scale,
  onSelectBlock,
  onStartTextEdit,
  onStopTextEdit,
  onUpdateText
}: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled: editingText
  });

  const style: CSSProperties = {
    left: block.layout.x,
    top: block.layout.y,
    width: block.layout.width,
    height: block.layout.height,
    transform: transform ? `translate3d(${transform.x / scale}px, ${transform.y / scale}px, 0)` : undefined,
    zIndex: isDragging ? 30 : selected ? 14 : 4
  };

  const textStyle = block.type === "text" ? normalizeTextStyle(block.style) : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`canvas-block ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
      {...attributes}
      {...listeners}
      onMouseDown={() => onSelectBlock(block.id)}
      onTouchStart={() => onSelectBlock(block.id)}
      onDoubleClick={() => {
        if (block.type === "text") {
          onStartTextEdit(block.id);
        }
      }}
    >
      <div className="canvas-block-content">
        {block.type === "text" && !editingText ? (
          <p className="canvas-text-view" style={textStyle}>
            {block.text || "Double-click to edit text"}
          </p>
        ) : null}

        {block.type === "text" && editingText ? (
          <textarea
            className="canvas-inline-editor"
            style={textStyle}
            autoFocus
            value={block.text}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onUpdateText(block.id, event.target.value)}
            onBlur={onStopTextEdit}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onStopTextEdit();
              }
            }}
          />
        ) : null}

        {block.type === "math" ? (
          <div className="canvas-math-view">
            <BlockMath math={block.latex || "\\text{Edit in the inspector panel}"} />
          </div>
        ) : null}

        {block.type === "graph" ? <GraphPreview spec={block.spec} /> : null}
      </div>
    </article>
  );
}

export function SlideCanvas({
  slide,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onUpdateText
}: SlideCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(CANVAS_WIDTH);
  const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    })
  );

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      setViewportWidth(element.clientWidth);
    };
    update();

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!slide) {
      setEditingTextBlockId(null);
      return;
    }

    if (editingTextBlockId && !slide.blocks.some((block) => block.id === editingTextBlockId && block.type === "text")) {
      setEditingTextBlockId(null);
    }
  }, [editingTextBlockId, slide]);

  useEffect(() => {
    if (!isDraggingBlock) {
      document.body.classList.remove("canvas-dragging");
      return;
    }

    document.body.classList.add("canvas-dragging");
    return () => {
      document.body.classList.remove("canvas-dragging");
    };
  }, [isDraggingBlock]);

  const scale = useMemo(() => Math.min(1, Math.max(0.2, viewportWidth / CANVAS_WIDTH)), [viewportWidth]);

  if (!slide) {
    return (
      <section className="canvas-stage-empty">
        <p>Select or create a slide.</p>
      </section>
    );
  }

  const currentSlide = slide;
  const scaledHeight = Math.round(CANVAS_HEIGHT * scale);

  function handleDragEnd(event: DragEndEvent): void {
    setIsDraggingBlock(false);
    const blockId = String(event.active.id);
    const block = currentSlide.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    const nextX = clamp(block.layout.x + event.delta.x / scale, 0, CANVAS_WIDTH - block.layout.width);
    const nextY = clamp(block.layout.y + event.delta.y / scale, 0, CANVAS_HEIGHT - block.layout.height);

    onMoveBlock(block.id, {
      x: Math.round(nextX),
      y: Math.round(nextY)
    });
  }

  return (
    <section className="canvas-stage">
      <div className="canvas-surface-wrap">
        <DndContext
          sensors={sensors}
          onDragStart={() => setIsDraggingBlock(true)}
          onDragCancel={() => setIsDraggingBlock(false)}
          onDragEnd={handleDragEnd}
        >
          <div className="canvas-viewport" ref={viewportRef} style={{ height: `${scaledHeight}px` }}>
            <div className="canvas-surface" role="presentation" style={{ transform: `scale(${scale})` }}>
              {currentSlide.blocks.map((block) => (
                <DraggableBlock
                  key={block.id}
                  block={block}
                  selected={selectedBlockId === block.id}
                  editingText={editingTextBlockId === block.id}
                  scale={scale}
                  onSelectBlock={onSelectBlock}
                  onStartTextEdit={setEditingTextBlockId}
                  onStopTextEdit={() => setEditingTextBlockId(null)}
                  onUpdateText={onUpdateText}
                />
              ))}
            </div>
          </div>
        </DndContext>
      </div>
    </section>
  );
}
