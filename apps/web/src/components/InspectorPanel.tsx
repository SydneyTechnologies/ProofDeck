import type { BlockLayout, GraphSpec, Slide } from "@proofdeck/core";

interface InspectorPanelProps {
  slide: Slide | undefined;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onSlideTitleChange: (title: string) => void;
  onAddText: () => void;
  onAddMath: () => void;
  onAddGraph: () => void;
  onUpdateText: (blockId: string, value: string) => void;
  onUpdateMath: (blockId: string, value: string) => void;
  onUpdateGraphSpec: (blockId: string, spec: GraphSpec) => void;
  onUpdateLayout: (blockId: string, layout: Partial<BlockLayout>) => void;
  onRemoveBlock: (blockId: string) => void;
}

function parseNumberArray(input: string): number[] {
  return input
    .split(",")
    .map((token) => Number(token.trim()))
    .filter((value) => Number.isFinite(value));
}

export function InspectorPanel({
  slide,
  selectedBlockId,
  onSelectBlock,
  onSlideTitleChange,
  onAddText,
  onAddMath,
  onAddGraph,
  onUpdateText,
  onUpdateMath,
  onUpdateGraphSpec,
  onUpdateLayout,
  onRemoveBlock
}: InspectorPanelProps) {
  const selectedBlock = slide?.blocks.find((block) => block.id === selectedBlockId) ?? null;

  return (
    <aside className="inspector-panel">
      <section className="panel">
        <h2>Slide</h2>
        <label className="field-label" htmlFor="slideTitleInput">
          Title
        </label>
        <input
          id="slideTitleInput"
          className="input"
          value={slide?.title ?? ""}
          onChange={(event) => onSlideTitleChange(event.target.value)}
          disabled={!slide}
        />

        <div className="toolbar stack-gap">
          <button className="button" onClick={onAddText} disabled={!slide}>
            + Text
          </button>
          <button className="button" onClick={onAddMath} disabled={!slide}>
            + Math
          </button>
          <button className="button" onClick={onAddGraph} disabled={!slide}>
            + Graph
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head-inline">
          <h2>Layers</h2>
          <p className="mono muted">{slide?.blocks.length ?? 0}</p>
        </div>
        <ul className="layer-list">
          {(slide?.blocks ?? []).map((block, index) => (
            <li key={block.id}>
              <button
                className={`layer-item ${selectedBlockId === block.id ? "active" : ""}`}
                onClick={() => onSelectBlock(block.id)}
              >
                <span className="mono">{index + 1}</span>
                <span>{block.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head-inline">
          <h2>Inspector</h2>
          {selectedBlock ? (
            <button className="button ghost danger" onClick={() => onRemoveBlock(selectedBlock.id)}>
              Remove
            </button>
          ) : null}
        </div>

        {!selectedBlock ? (
          <p className="muted">Select a block on the canvas.</p>
        ) : (
          <>
            <div className="grid-2">
              <div>
                <label className="field-label" htmlFor="layoutX">
                  X
                </label>
                <input
                  id="layoutX"
                  className="input mono"
                  type="number"
                  value={selectedBlock.layout.x}
                  onChange={(event) => onUpdateLayout(selectedBlock.id, { x: Number(event.target.value) })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="layoutY">
                  Y
                </label>
                <input
                  id="layoutY"
                  className="input mono"
                  type="number"
                  value={selectedBlock.layout.y}
                  onChange={(event) => onUpdateLayout(selectedBlock.id, { y: Number(event.target.value) })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="layoutWidth">
                  W
                </label>
                <input
                  id="layoutWidth"
                  className="input mono"
                  type="number"
                  value={selectedBlock.layout.width}
                  onChange={(event) => onUpdateLayout(selectedBlock.id, { width: Number(event.target.value) })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="layoutHeight">
                  H
                </label>
                <input
                  id="layoutHeight"
                  className="input mono"
                  type="number"
                  value={selectedBlock.layout.height}
                  onChange={(event) => onUpdateLayout(selectedBlock.id, { height: Number(event.target.value) })}
                />
              </div>
            </div>

            {selectedBlock.type === "text" ? (
              <>
                <label className="field-label" htmlFor="textInput">
                  Text
                </label>
                <textarea
                  id="textInput"
                  className="textarea"
                  rows={6}
                  value={selectedBlock.text}
                  onChange={(event) => onUpdateText(selectedBlock.id, event.target.value)}
                />
              </>
            ) : null}

            {selectedBlock.type === "math" ? (
              <>
                <label className="field-label" htmlFor="mathInput">
                  LaTeX
                </label>
                <textarea
                  id="mathInput"
                  className="textarea mono"
                  rows={6}
                  value={selectedBlock.latex}
                  onChange={(event) => onUpdateMath(selectedBlock.id, event.target.value)}
                />
              </>
            ) : null}

            {selectedBlock.type === "graph" ? (
              <>
                <label className="field-label" htmlFor="graphTitleInput">
                  Title
                </label>
                <input
                  id="graphTitleInput"
                  className="input"
                  value={selectedBlock.spec.title ?? ""}
                  onChange={(event) =>
                    onUpdateGraphSpec(selectedBlock.id, {
                      ...selectedBlock.spec,
                      title: event.target.value
                    })
                  }
                />

                <label className="field-label" htmlFor="graphXInput">
                  X values (comma separated)
                </label>
                <input
                  id="graphXInput"
                  className="input mono"
                  value={selectedBlock.spec.x.join(", ")}
                  onChange={(event) => {
                    const nextX = parseNumberArray(event.target.value);
                    if (nextX.length < 2) {
                      return;
                    }
                    onUpdateGraphSpec(selectedBlock.id, {
                      ...selectedBlock.spec,
                      x: nextX
                    });
                  }}
                />

                <label className="field-label" htmlFor="graphYInput">
                  Y values (comma separated)
                </label>
                <input
                  id="graphYInput"
                  className="input mono"
                  value={selectedBlock.spec.y.join(", ")}
                  onChange={(event) => {
                    const nextY = parseNumberArray(event.target.value);
                    if (nextY.length < 2) {
                      return;
                    }
                    onUpdateGraphSpec(selectedBlock.id, {
                      ...selectedBlock.spec,
                      y: nextY
                    });
                  }}
                />
              </>
            ) : null}
          </>
        )}
      </section>
    </aside>
  );
}
