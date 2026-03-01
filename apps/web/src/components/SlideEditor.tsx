import type { Slide } from "@proofdeck/core";

interface SlideEditorProps {
  slide: Slide | undefined;
  onSlideTitleChange: (title: string) => void;
  onAddTextBlock: () => void;
  onAddMathBlock: () => void;
  onAddGraphBlock: () => void;
  onTextChange: (blockId: string, value: string) => void;
  onMathChange: (blockId: string, value: string) => void;
  onRemoveBlock: (blockId: string) => void;
}

export function SlideEditor({
  slide,
  onSlideTitleChange,
  onAddTextBlock,
  onAddMathBlock,
  onAddGraphBlock,
  onTextChange,
  onMathChange,
  onRemoveBlock
}: SlideEditorProps) {
  if (!slide) {
    return (
      <section className="panel">
        <h2>Editor</h2>
        <p className="muted">No slide selected.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Editor</h2>
        <div className="toolbar">
          <button className="button" onClick={onAddTextBlock}>
            + Text
          </button>
          <button className="button" onClick={onAddMathBlock}>
            + Math
          </button>
          <button className="button" onClick={onAddGraphBlock}>
            + Graph
          </button>
        </div>
      </div>
      <label className="field-label" htmlFor="slideTitle">
        Slide Title
      </label>
      <input
        id="slideTitle"
        className="input"
        value={slide.title}
        onChange={(event) => onSlideTitleChange(event.target.value)}
      />

      <div className="blocks">
        {slide.blocks.map((block) => (
          <article key={block.id} className="block-card">
            <div className="block-header">
              <p className="mono block-type">{block.type.toUpperCase()}</p>
              <button className="button button-ghost" onClick={() => onRemoveBlock(block.id)}>
                Remove
              </button>
            </div>

            {block.type === "text" && (
              <textarea
                className="textarea"
                value={block.text}
                onChange={(event) => onTextChange(block.id, event.target.value)}
                rows={3}
              />
            )}

            {block.type === "math" && (
              <textarea
                className="textarea mono"
                value={block.latex}
                onChange={(event) => onMathChange(block.id, event.target.value)}
                rows={3}
              />
            )}

            {block.type === "graph" && (
              <div className="graph-meta">
                <p>{block.spec.title || "Untitled graph"}</p>
                <p className="mono muted">
                  {block.spec.type} | {block.spec.x.length} points
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
