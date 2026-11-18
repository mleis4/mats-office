/*
 * ============================================================================
 * Program Name:   ConcreteModelWindow.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    The Concrete Strength Predictor's app window: a short,
 *                 scrollable progress report laid out like a notebook's
 *                 markdown cells, with the group's own figures. All wording
 *                 and numbers come from src/data/concreteReport.json, which
 *                 was written from the executed outputs of the group's
 *                 notebook (validation split only; the test set is unused).
 *                 No code from the notebook is shown (README §15).
 * ============================================================================
 */

import report from '../../data/concreteReport.json';

// ---- One section of the report: paragraphs, then a table, bullets and a figure if it has them ----
function ReportSection({ section, sectionNumber }) {
  return (
    <section className="report-section">
      <h3>
        <span className="report-number">{sectionNumber}</span>
        {section.heading}
      </h3>

      {section.table && (
        <table className="report-table">
          <thead>
            <tr>
              {section.table.columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {section.table.rows.map((row, rowIndex) => (
              <tr key={row[0]} className={rowIndex === section.table.highlightRow ? 'is-best' : undefined}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {section.paragraphs?.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}

      {section.bullets && (
        <ul>
          {section.bullets.map((bullet) => <li key={bullet.slice(0, 24)}>{bullet}</li>)}
        </ul>
      )}

      {section.figure && (
        <figure className="report-figure">
          <img src={section.figure.src} alt={section.figure.alt} loading="lazy" />
          <figcaption>{section.figure.caption}</figcaption>
        </figure>
      )}
    </section>
  );
}

export default function ConcreteModelWindow() {
  return (
    <article className="report">
      <header className="report-header">
        <h2>{report.title}</h2>
        <p className="report-byline">{report.byline}</p>
        <p className="report-status">{report.status}</p>
      </header>

      {report.sections.map((section, sectionIndex) => (
        <ReportSection key={section.heading} section={section} sectionNumber={sectionIndex + 1} />
      ))}
    </article>
  );
}
