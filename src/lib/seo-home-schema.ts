import type { Locale } from '#/i18n/locales'
import { HTML_LANG } from '#/i18n/locales'
import { getLandingContent } from '#/i18n/content'
import { LEGAL_COMPANY } from '#/lib/legal/company'
import { brandLogoUrl, publicSitePath, publicSiteUrl } from '#/lib/brand'
import { SEO_OG_IMAGE } from '#/lib/seo-meta'

/** JSON-LD for homepage — AutoRental + FAQPage. */
export function buildHomeStructuredData(locale: Locale = 'en') {
  const siteUrl = publicSiteUrl()
  const logoUrl = brandLogoUrl(siteUrl)
  const heroImageUrl = publicSitePath(SEO_OG_IMAGE, siteUrl)

  const autoRental = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    '@id': `${siteUrl}/#organization`,
    name: 'Car XQ',
    alternateName: 'Car XQ Langkawi',
    url: siteUrl,
    logo: logoUrl,
    image: heroImageUrl,
    description:
      'Family-owned car rental in Langkawi, Malaysia since 2015. Free delivery to Langkawi Airport, ferry jetty, and hotels. Economy, MPV and SUV fleet from RM 70/day.',
    telephone: '+60-11-3521-5576',
    priceRange: 'RM 70+',
    currenciesAccepted: 'MYR',
    paymentAccepted: 'Cash, Credit Card, FPX, Touch n Go',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Langkawi, Kedah, Malaysia',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '26 & 28, 1st Floor, Jalan Pandak Mayah 4, Mukim Kuah',
      addressLocality: 'Langkawi',
      addressRegion: 'Kedah',
      postalCode: '07000',
      addressCountry: 'MY',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 6.3297,
      longitude: 99.8431,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Langkawi car rental fleet',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Economy car rental Langkawi',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'MPV rental Langkawi',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Langkawi airport car rental pickup',
          },
        },
      ],
    },
    legalName: LEGAL_COMPANY.name,
  }

  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'Car XQ — Car Rental Langkawi',
    publisher: { '@id': `${siteUrl}/#organization` },
    inLanguage: HTML_LANG[locale],
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: getLandingContent(locale).faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  return { autoRental, webSite, faqPage }
}

export function homeStructuredDataScripts(locale: Locale = 'en') {
  const { autoRental, webSite, faqPage } = buildHomeStructuredData(locale)
  return [
    { id: 'auto-rental', json: JSON.stringify(autoRental) },
    { id: 'website', json: JSON.stringify(webSite) },
    { id: 'faq-page', json: JSON.stringify(faqPage) },
  ]
}

export function homeCanonicalUrl(): string {
  return publicSitePath('/')
}
