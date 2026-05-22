import type { LegalSection } from '#/lib/legal/types'

export function LegalDocumentContent({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((section, i) => {
        if (section.type === 'h2') {
          return (
            <h2 key={i} className="legal-h2">
              {section.text}
            </h2>
          )
        }
        if (section.type === 'h3') {
          return (
            <h3 key={i} className="legal-h3">
              {section.text}
            </h3>
          )
        }
        if (section.type === 'p') {
          return (
            <p key={i} className="legal-p">
              {section.text}
            </p>
          )
        }
        if (section.type === 'table') {
          return (
            <div key={i} className="legal-table-wrap">
              <table className="legal-table">
                <thead>
                  <tr>
                    {section.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (section.type === 'signature') {
          return (
            <div key={i} className="legal-signature">
              {section.fields.map((field) => (
                <p key={field}>{field}</p>
              ))}
            </div>
          )
        }
        return (
          <ul key={i} className="legal-ul">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )
      })}
    </>
  )
}
