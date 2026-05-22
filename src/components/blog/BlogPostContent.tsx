import type { BlogSection } from '#/lib/blog/types'

export function BlogPostContent({ sections }: { sections: BlogSection[] }) {
  return (
    <>
      {sections.map((section, i) => {
        if (section.type === 'h2') {
          return <h2 key={i}>{section.text}</h2>
        }
        if (section.type === 'p') {
          return <p key={i}>{section.text}</p>
        }
        return (
          <ul key={i}>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )
      })}
    </>
  )
}
