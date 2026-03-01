import type { Deck, LintReport } from "@proofdeck/core";

interface LintPanelProps {
  deck: Deck;
  report: LintReport;
}

export function LintPanel({ deck, report }: LintPanelProps) {
  const slideTitleById = new Map(deck.slides.map((slide) => [slide.id, slide.title]));

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Deterministic Lint</h2>
        <p className="muted mono">
          E:{report.summary.errors} W:{report.summary.warnings}
        </p>
      </div>

      {report.issues.length === 0 ? (
        <p className="status-good">No notation issues detected.</p>
      ) : (
        <ul className="issue-list">
          {report.issues.map((issue) => (
            <li key={issue.id} className={`issue issue-${issue.severity}`}>
              <p>{issue.message}</p>
              <p className="mono muted">
                {slideTitleById.get(issue.slideId) || issue.slideId} / {issue.blockId}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
