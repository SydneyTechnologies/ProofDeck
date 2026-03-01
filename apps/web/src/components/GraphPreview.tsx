import type { GraphSpec } from "@proofdeck/core";

interface GraphPreviewProps {
  spec: GraphSpec;
}

export function GraphPreview({ spec }: GraphPreviewProps) {
  const points = spec.x
    .map((xValue, index) => ({ x: xValue, y: spec.y[index] }))
    .filter((point): point is { x: number; y: number } => typeof point.y === "number");

  if (points.length < 2) {
    return <p className="muted">Need at least two points for a graph preview.</p>;
  }

  const xMin = Math.min(...points.map((point) => point.x));
  const xMax = Math.max(...points.map((point) => point.x));
  const yMin = Math.min(...points.map((point) => point.y));
  const yMax = Math.max(...points.map((point) => point.y));

  const width = 320;
  const height = 160;
  const padding = 16;

  const normalized = points.map((point) => {
    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;
    const px = padding + ((point.x - xMin) / xSpan) * (width - padding * 2);
    const py = height - padding - ((point.y - yMin) / ySpan) * (height - padding * 2);
    return { px, py };
  });

  const polyline = normalized.map((point) => `${point.px},${point.py}`).join(" ");

  return (
    <div className="graph-preview">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={spec.title || "Graph preview"}>
        <rect x={0} y={0} width={width} height={height} rx={10} className="graph-bg" />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} className="graph-axis" />
        <line
          x1={padding}
          x2={width - padding}
          y1={height - padding}
          y2={height - padding}
          className="graph-axis"
        />
        {(spec.type === "line" || spec.type === "scatter") && <polyline points={polyline} className="graph-line" />}
        {spec.type === "scatter" &&
          normalized.map((point, index) => <circle key={index} cx={point.px} cy={point.py} r={3.4} className="graph-dot" />)}
        {spec.type === "bar" &&
          normalized.map((point, index) => {
            const barWidth = (width - padding * 2) / normalized.length - 6;
            return (
              <rect
                key={index}
                x={point.px - barWidth / 2}
                y={point.py}
                width={barWidth}
                height={height - padding - point.py}
                className="graph-bar"
              />
            );
          })}
      </svg>
    </div>
  );
}
