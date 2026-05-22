import { homeStructuredDataScripts } from '#/lib/seo-home-schema'

/** Injects homepage JSON-LD (AutoRental, WebSite, FAQPage) for crawlers. */
export function HomeStructuredData() {
  return (
    <>
      {homeStructuredDataScripts().map(({ id, json }) => (
        <script
          key={id}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
    </>
  )
}
