import { LEGAL_COMPANY } from '#/lib/legal/company'
import { pdpaMsLocale } from '#/lib/legal/pdpa-ms'
import { pdpaZhLocale } from '#/lib/legal/pdpa-zh'
import { h2, h3, p, ul } from '#/lib/legal/sections'
import type { LegalDocument } from '#/lib/legal/types'

export const pdpaDocument: LegalDocument = {
  slug: 'pdpa',
  path: '/pdpa',
  title: 'Personal Data Protection Notice',
  metaTitle: 'PDPA Notice | XQ Car Rental Langkawi',
  metaDescription:
    'Personal Data Protection Act 2010 (PDPA) notice for XQ Car Rental — data collection, purposes, rights, and contact details. Available in English and Bahasa Malaysia.',
  effectiveDate: LEGAL_COMPANY.effectiveDate,
  version: LEGAL_COMPANY.version,
  documentLabel: 'Document 5: Personal Data Protection Act (PDPA) Notice',
  locales: [pdpaMsLocale, pdpaZhLocale],
  sections: [
    h2('1. Purpose of This Notice'),
    p(
      'This Personal Data Protection Notice ("Notice") is issued by Xiao Qiang Holidays Sdn Bhd (Company Registration No. 201301017811), trading as XQ Car Rental ("the Company"), in accordance with the Personal Data Protection Act 2010 ("PDPA").',
    ),
    p(
      'This Notice informs you of the personal data we collect, the purposes for which we use it, your rights, and how you may contact us regarding your personal data.',
    ),
    p(
      'This Notice should be read together with our Privacy Policy, which provides more detailed information about our data practices.',
    ),
    h2('2. Personal Data We Collect'),
    p('The Company collects and processes the following categories of personal data:'),
    ul(
      'Identification data: full name, date of birth, gender, nationality, identification document numbers (passport, MyKad, or equivalent), and copies of such documents.',
      'Driving credentials: driving licence number, issuing country, expiry date, and International Driving Permit details.',
      'Contact data: residential address, postal address, email address, and telephone number.',
      'Financial data: payment card details (processed through PCI-compliant payment gateways), billing address, and transaction history.',
      'Booking and rental data: booking history, vehicle preferences, pickup and return locations, and rental periods.',
      'Vehicle usage data: GPS location, mileage, telematics data, and incident records (where the Vehicle is fitted with such systems).',
      'Visual data: photographs taken at vehicle handover and return, and CCTV footage at our premises.',
      'Communication data: correspondence with our customer service team, including emails, WhatsApp messages, and call records.',
      'Emergency contact data: name and contact details of the person you nominate.',
    ),
    h2('3. Purposes of Processing'),
    p('Your personal data is collected and processed for the following purposes:'),
    ul(
      'To process and manage your booking, including verifying eligibility, identity, and driving credentials.',
      'To process payments, refunds, deposits, and recovery of outstanding amounts.',
      'To handle vehicle handover, return, inspection, and incident management.',
      'To administer insurance coverage and process insurance claims.',
      'To respond to your enquiries and provide customer service.',
      'To prevent and detect fraud, money laundering, and other unlawful activity.',
      'To comply with our legal and regulatory obligations under Malaysian law, including tax, accounting, and reporting requirements.',
      'To enforce our terms and conditions and pursue debt recovery.',
      'To improve our services and conduct internal analytics and quality assurance.',
      'To send marketing communications about our services, where you have consented or where permitted by law.',
      'To cooperate with police, courts, and regulatory authorities as legally required.',
    ),
    h2('4. Source of Personal Data'),
    p('We collect personal data:'),
    ul(
      'Directly from you when you create an account, make a booking, communicate with us, or use our services.',
      'Automatically when you use our website or our vehicles fitted with telematics systems.',
      'From third parties, including payment processors, identity verification providers, fraud screening providers, insurers, and authorities, where lawful.',
    ),
    h2('5. Mandatory and Voluntary Data'),
    p('Most of the personal data we request is mandatory to enable us to provide our services. If you do not provide this data, we will not be able to:'),
    ul(
      'Verify your identity and driving eligibility.',
      'Process your booking or release a vehicle to you.',
      'Process insurance coverage on your behalf.',
      'Comply with our legal obligations.',
    ),
    p(
      'Some data is voluntary (such as marketing preferences and emergency contact details). You may decline to provide voluntary data without affecting our ability to provide rental services to you.',
    ),
    h2('6. Disclosure of Personal Data'),
    p('We may disclose your personal data to the following classes of third parties:'),
    ul(
      'Companies within our group, subsidiaries, and affiliates.',
      'Fleet partners and third-party vehicle suppliers fulfilling part of your booking.',
      'Payment processors, banks, and financial institutions.',
      'Insurers, insurance brokers, and loss adjusters.',
      'Identity verification, credit check, and fraud screening service providers.',
      'IT service providers, cloud hosting providers, and software vendors supporting our operations.',
      'Legal advisors, accountants, auditors, and other professional consultants under confidentiality obligations.',
      'Debt recovery agencies, where amounts remain outstanding.',
      'Government bodies, regulators, courts, and law enforcement, where required by law.',
      'Any party to whom we may transfer our business or assets in the event of a sale, merger, or restructuring.',
    ),
    h2('7. Transfer of Personal Data Outside Malaysia'),
    p('Some of the service providers we engage (including cloud hosting and payment processing providers) may be located outside Malaysia. Where personal data is transferred outside Malaysia, we ensure that:'),
    ul(
      'The recipient country provides a level of protection comparable to the PDPA, or',
      'Appropriate contractual safeguards are in place to protect your data, or',
      'You have consented to the transfer.',
    ),
    h2('8. Retention of Personal Data'),
    p(
      'We retain personal data only for as long as necessary for the purposes set out in this Notice or as required by law. Retention periods are detailed in our Privacy Policy.',
    ),
    h2('9. Your Rights Under the PDPA'),
    p('You have the following rights in respect of your personal data:'),
    h3('9.1 Right of Access'),
    p(
      'You may request a copy of the personal data we hold about you. We may charge a prescribed fee for processing your request, as permitted under the PDPA.',
    ),
    h3('9.2 Right of Correction'),
    p(
      'You may request correction of personal data that is inaccurate, incomplete, misleading, or out of date.',
    ),
    h3('9.3 Right to Withdraw Consent'),
    p(
      'You may withdraw consent previously given for the processing of your personal data. Withdrawal does not affect the lawfulness of processing carried out before withdrawal, and may affect our ability to provide services to you.',
    ),
    h3('9.4 Right to Limit Processing'),
    p('You may request that we limit the processing of your personal data in certain circumstances.'),
    h3('9.5 Right to Prevent Direct Marketing'),
    p(
      'You may, at any time and without charge, request that we stop using your personal data for direct marketing purposes.',
    ),
    h2('10. How to Exercise Your Rights'),
    p('To exercise any of the rights set out above, or for any question or complaint regarding your personal data, please contact our Data Protection Officer:'),
    p(
      `Data Protection Officer\n${LEGAL_COMPANY.name}\n${LEGAL_COMPANY.address}\nWebsite: ${LEGAL_COMPANY.website}`,
    ),
    p(
      'We will respond to your request within twenty-one (21) days from the date we receive a valid request, as required under the PDPA. Complex requests may require additional time, and we will notify you accordingly.',
    ),
    h2('11. Complaints to the Commissioner'),
    p('If you are dissatisfied with our handling of your personal data or your request, you may lodge a complaint with the Personal Data Protection Commissioner of Malaysia:'),
    p(
      'Department of Personal Data Protection (Jabatan Perlindungan Data Peribadi)\nMinistry of Communications and Digital, Malaysia\nWebsite: www.pdp.gov.my',
    ),
    h2('12. Consent'),
    p(
      'By submitting your personal data to the Company through any of our service channels (including the website, mobile applications, telephone, email, WhatsApp, or in person), you consent to the collection, use, and disclosure of your personal data in accordance with this Notice.',
    ),
    p(
      'Where you provide personal data of a third party (such as an additional driver or emergency contact), you confirm that you have obtained that person\'s consent for us to process their personal data in accordance with this Notice.',
    ),
    h2('13. Updates to This Notice'),
    p(
      'We may update this Notice from time to time to reflect changes in our practices or in applicable law. The current version is identified by its effective date. Material changes will be notified through the Platform or by email.',
    ),
  ],
}
