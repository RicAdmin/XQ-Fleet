import { LEGAL_COMPANY } from '#/lib/legal/company'
import { privacyMsLocale } from '#/lib/legal/privacy-ms'
import { privacyZhLocale } from '#/lib/legal/privacy-zh'
import { h2, h3, p, ul } from '#/lib/legal/sections'
import type { LegalDocument } from '#/lib/legal/types'

export const privacyDocument: LegalDocument = {
  slug: 'privacy',
  path: '/privacy',
  title: 'Privacy Policy',
  metaTitle: 'Privacy Policy | XQ Car Rental Langkawi',
  metaDescription:
    'How XQ Car Rental collects, uses, and protects your personal data. Operated by Xiao Qiang Holidays Sdn Bhd in Langkawi, Malaysia.',
  effectiveDate: LEGAL_COMPANY.effectiveDate,
  version: LEGAL_COMPANY.version,
  documentLabel: 'Document 3: Privacy Policy',
  locales: [privacyMsLocale, privacyZhLocale],
  sections: [
    h2('1. About This Policy'),
    p(
      'This Privacy Policy explains how Xiao Qiang Holidays Sdn Bhd (Company Registration No. 201301017811), trading as XQ Car Rental ("the Company", "we", "us", or "our"), collects, uses, discloses, and protects your personal data when you use our website, mobile applications, and services.',
    ),
    p(
      'This Policy is to be read together with our PDPA Notice, which sets out your statutory rights under the Personal Data Protection Act 2010 ("PDPA").',
    ),
    h2('2. Information We Collect'),
    p(
      'We collect personal data that you provide directly, data generated through your use of our services, and data obtained from third parties where lawful.',
    ),
    h3('2.1 Information You Provide'),
    ul(
      'Full name, gender, date of birth, and nationality.',
      'Identification documents (passport, MyKad, or other government-issued ID).',
      'Driving licence details, including International Driving Permit where applicable.',
      'Contact information (email address, telephone number, postal address).',
      'Payment information (card details processed through PCI-compliant payment gateways; we do not store full card numbers).',
      'Booking history and customer service correspondence.',
      'Emergency contact information where provided.',
    ),
    h3('2.2 Information Generated Through Service Use'),
    ul(
      'Vehicle GPS and telematics data, including location, speed, mileage, and harsh braking events, where the Vehicle is fitted with such systems.',
      'Photographs taken at vehicle handover and return.',
      'CCTV footage at our office and pickup locations.',
      'Website analytics, cookies, IP address, browser type, and device identifiers.',
    ),
    h3('2.3 Information from Third Parties'),
    ul(
      'Fraud screening and identity verification providers.',
      'Credit card issuers and payment processors.',
      'Insurers, in connection with claims.',
      'Authorities, where legally required.',
    ),
    h2('3. How We Use Your Information'),
    p('We use your personal data for the following purposes:'),
    ul(
      'Processing bookings, payments, and refunds.',
      'Verifying identity, driving eligibility, and detecting fraud.',
      'Vehicle handover, recovery, and incident management.',
      'Insurance administration and claims processing.',
      'Customer service and communication.',
      'Compliance with Malaysian law, including reporting to authorities where required.',
      'Recovery of outstanding amounts, including damage, fines, and unpaid charges.',
      'Service improvement, internal analytics, and quality assurance.',
      'Marketing communications, where you have consented or where permitted by law.',
    ),
    h2('4. Legal Basis for Processing'),
    p('We process personal data on one or more of the following legal bases under the PDPA:'),
    ul(
      'Performance of our contract with you.',
      'Compliance with legal obligations.',
      'Your consent (which you may withdraw at any time).',
      'Our legitimate interests in operating, securing, and improving our services.',
    ),
    h2('5. Disclosure of Your Information'),
    p(
      'We may disclose your personal data to the following categories of recipients, only as necessary for the purposes stated in this Policy:',
    ),
    ul(
      'Fleet partners and third-party vehicle suppliers.',
      'Payment processors and financial institutions.',
      'Insurers and insurance adjusters.',
      'Identity verification and fraud screening providers.',
      'Legal advisors, auditors, and professional consultants under confidentiality obligations.',
      'Government authorities, regulators, and law enforcement, where legally required.',
      'Debt recovery agencies, where outstanding amounts remain unpaid.',
      'Courts and tribunals, in connection with legal proceedings.',
    ),
    p('We do not sell your personal data to third parties for marketing purposes.'),
    h2('6. International Transfer of Data'),
    p(
      'Where we transfer personal data outside Malaysia (for example, to cloud service providers or international payment processors), we ensure that the receiving party provides a level of protection comparable to that required under the PDPA, through contractual safeguards or by the data subject\'s consent.',
    ),
    h2('7. Data Retention'),
    p(
      'We retain personal data only for as long as necessary to fulfil the purposes for which it was collected, including legal, accounting, and reporting requirements.',
    ),
    ul(
      'Booking and rental records: seven (7) years from the end of the Rental Period, in line with Malaysian tax and accounting requirements.',
      'Identification document copies: three (3) years from the last interaction, unless required longer for legal or insurance purposes.',
      'CCTV footage: thirty (30) days unless retained for a specific incident.',
      'Vehicle GPS and telematics data: ninety (90) days unless retained for a specific incident or claim.',
      'Marketing data: until you withdraw consent or unsubscribe.',
    ),
    h2('8. Data Security'),
    p(
      'We implement reasonable technical and organisational measures to protect personal data against loss, misuse, unauthorised access, disclosure, alteration, and destruction. These include access controls, encrypted payment processing, secure storage, and staff confidentiality obligations.',
    ),
    p(
      'No method of transmission or storage is completely secure. While we take all reasonable steps to protect your data, we cannot guarantee absolute security.',
    ),
    h2('9. Your Rights'),
    p('Subject to the PDPA, you have the following rights in respect of your personal data:'),
    ul(
      'Right of access: to request a copy of the personal data we hold about you.',
      'Right of correction: to request correction of inaccurate or incomplete data.',
      'Right to withdraw consent: to withdraw consent previously given, subject to legal or contractual restrictions.',
      'Right to limit processing: to request that we limit certain uses of your data.',
      'Right to prevent direct marketing: to opt out of marketing communications at any time.',
    ),
    p(
      'To exercise any of these rights, contact us using the details in Section 12. We may charge a reasonable fee for processing access requests as permitted under the PDPA.',
    ),
    h2('10. Cookies and Tracking Technologies'),
    p('Our website uses cookies and similar technologies to:'),
    ul(
      'Enable essential website functionality.',
      'Remember your preferences.',
      'Analyse website traffic and user behaviour.',
      'Deliver relevant advertising, where applicable.',
    ),
    p(
      'You may disable cookies through your browser settings, though some features of the Platform may not function properly as a result.',
    ),
    h2('11. Children\'s Privacy'),
    p(
      'Our services are not directed at persons under the age of eighteen (18). We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us so we can take appropriate action.',
    ),
    h2('12. Contact and Complaints'),
    p('For questions about this Privacy Policy, to exercise your rights, or to make a complaint, contact our Data Protection Officer:'),
    p(
      `${LEGAL_COMPANY.name}\nAttn: Data Protection Officer\n${LEGAL_COMPANY.address}\nWebsite: ${LEGAL_COMPANY.website}`,
    ),
    p(
      'If you are not satisfied with our response, you may lodge a complaint with the Personal Data Protection Commissioner of Malaysia at www.pdp.gov.my.',
    ),
    h2('13. Changes to This Policy'),
    p(
      'We may update this Privacy Policy from time to time. Material changes will be notified through the Platform or by email. The current version is identified by its effective date at the top of this document.',
    ),
  ],
}
