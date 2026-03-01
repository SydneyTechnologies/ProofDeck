import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { BlockMath } from "react-katex";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { BlockLayout, Slide } from "@proofdeck/core";
import { GraphPreview } from "./GraphPreview";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

const MIN_BLOCK_WIDTH = 120;
const MIN_BLOCK_HEIGHT = 72;

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface SlideCanvasProps {
  slide: Slide | undefined;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, layout: Partial<BlockLayout>) => void;
  onUpdateText: (blockId: string, value: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

interface DraggableBlockProps {
  block: Slide["blocks"][number];
  selected: boolean;
  editingText: boolean;
  scale: number;
  onSelectBlock: (blockId: string) => void;
  onStartTextEdit: (blockId: string) => void;
  onStopTextEdit: () => void;
  onBeginResize: (event: ReactPointerEvent<HTMLButtonElement>, blockId: string, direction: ResizeDirection) => void;
  onUpdateText: (blockId: string, value: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

interface ResizeState {
  blockId: string;
  direction: ResizeDirection;
  startClientX: number;
  startClientY: number;
  startLayout: BlockLayout;
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
  onBeginResize,
  onUpdateText,
  onDeleteBlock
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
      className={`canvas-block canvas-block-${block.type} ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
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
      {selected ? (
        <>
          <div className="canvas-block-controls">
            <span className="canvas-block-tag">{block.type}</span>

            {block.type === "text" ? (
              <button
                className="canvas-edit-toggle"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (editingText) {
                    onStopTextEdit();
                  } else {
                    onStartTextEdit(block.id);
                  }
                }}
              >
                {editingText ? "Done" : "Edit text"}
              </button>
            ) : null}

            <button
              className="canvas-delete-btn"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteBlock(block.id);
              }}
            >
              Delete
            </button>
          </div>

          <button className="canvas-resize-handle nw" onPointerDown={(event) => onBeginResize(event, block.id, "nw")} />
          <button className="canvas-resize-handle ne" onPointerDown={(event) => onBeginResize(event, block.id, "ne")} />
          <button className="canvas-resize-handle sw" onPointerDown={(event) => onBeginResize(event, block.id, "sw")} />
          <button className="canvas-resize-handle se" onPointerDown={(event) => onBeginResize(event, block.id, "se")} />
          <button className="canvas-resize-handle n" onPointerDown={(event) => onBeginResize(event, block.id, "n")} />
          <button className="canvas-resize-handle s" onPointerDown={(event) => onBeginResize(event, block.id, "s")} />
          <button className="canvas-resize-handle e" onPointerDown={(event) => onBeginResize(event, block.id, "e")} />
          <button className="canvas-resize-handle w" onPointerDown={(event) => onBeginResize(event, block.id, "w")} />
        </>
      ) : null}

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
  onUpdateText,
  onDeleteBlock
}: SlideCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(CANVAS_WIDTH);
  const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

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

  const scale = useMemo(() => Math.min(1, Math.max(0.2, viewportWidth / CANVAS_WIDTH)), [viewportWidth]);

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = (event.clientX - resizeState.startClientX) / scale;
      const deltaY = (event.clientY - resizeState.startClientY) / scale;

      let x = resizeState.startLayout.x;
      let y = resizeState.startLayout.y;
      let width = resizeState.startLayout.width;
      let height = resizeState.startLayout.height;

      if (resizeState.direction.includes("e")) {
        width = resizeState.startLayout.width + deltaX;
      }
      if (resizeState.direction.includes("s")) {
        height = resizeState.startLayout.height + deltaY;
      }
      if (resizeState.direction.includes("w")) {
        width = resizeState.startLayout.width - deltaX;
        x = resizeState.startLayout.x + deltaX;
      }
      if (resizeState.direction.includes("n")) {
        height = resizeState.startLayout.height - deltaY;
        y = resizeState.startLayout.y + deltaY;
      }

      if (width < MIN_BLOCK_WIDTH) {
        if (resizeState.direction.includes("w")) {
          x -= MIN_BLOCK_WIDTH - width;
        }
        width = MIN_BLOCK_WIDTH;
      }

      if (height < MIN_BLOCK_HEIGHT) {
        if (resizeState.direction.includes("n")) {
          y -= MIN_BLOCK_HEIGHT - height;
        }
        height = MIN_BLOCK_HEIGHT;
      }

      x = clamp(x, 0, CANVAS_WIDTH - MIN_BLOCK_WIDTH);
      y = clamp(y, 0, CANVAS_HEIGHT - MIN_BLOCK_HEIGHT);

      if (x + width > CANVAS_WIDTH) {
        width = CANVAS_WIDTH - x;
      }
      if (y + height > CANVAS_HEIGHT) {
        height = CANVAS_HEIGHT - y;
      }

      onMoveBlock(resizeState.blockId, {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height)
      });
    };

    const handlePointerUp = () => {
      setResizeState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onMoveBlock, resizeState, scale]);

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

  function beginResize(event: ReactPointerEvent<HTMLButtonElement>, blockId: string, direction: ResizeDirection): void {
    event.preventDefault();
    event.stopPropagation();

    const block = currentSlide.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    onSelectBlock(block.id);
    setResizeState({
      blockId,
      direction,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLayout: {
        ...block.layout
      }
    });
  }

  return (
    <section className="canvas-stage">
      <div className="canvas-surface-wrap">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                  onBeginResize={beginResize}
                  onUpdateText={onUpdateText}
                  onDeleteBlock={onDeleteBlock}
                />
              ))}
            </div>
          </div>
        </DndContext>
      </div>
    </section>
  );
}
