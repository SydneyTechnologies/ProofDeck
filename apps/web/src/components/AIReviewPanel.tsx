import type { ReviewResult } from "@proofdeck/ai";

interface AIReviewPanelProps {
  providerReady: boolean;
  equation: string;
  onEquationChange: (value: string) => void;
  onRunReview: () => Promise<void>;
  onSuggestGraph: () => Promise<void>;
  review: ReviewResult | null;
  busy: boolean;
  error: string | null;
}

export function AIReviewPanel({
  providerReady,
  equation,
  onEquationChange,
  onRunReview,
  onSuggestGraph,
  review,
  busy,
  error
}: AIReviewPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>AI Review</h2>
        <p className="muted mono">Provider {providerReady ? "ready" : "not ready"}</p>
      </div>

      <div className="toolbar">
        <button className="button button-accent" disabled={!providerReady || busy} onClick={() => void onRunReview()}>
          Run Notation Review
        </button>
      </div>

      <label className="field-label" htmlFor="graphEquation">
        Equation for graph suggestion
      </label>
      <input
        id="graphEquation"
        className="input mono"
        value={equation}
        onChange={(event) => onEquationChange(event.target.value)}
      />

      <button className="button" disabled={!providerReady || busy} onClick={() => void onSuggestGraph()}>
        Suggest Graph
      </button>

      {error ? <p className="status-error">{error}</p> : null}

      {review ? (
        <div className="ai-review-result">
          <p className="status-good">{review.summary}</p>
          <ul className="issue-list">
            {review.issues.map((issue, index) => (
              <li key={`${issue.message}-${index}`} className={`issue issue-${issue.severity}`}>
                <p>{issue.message}</p>
                <p className="mono muted">
                  {issue.slideId || "n/a"} / {issue.blockId || "n/a"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">No AI review run yet.</p>
      )}
    </section>
  );
}
