import { LEGAL_COMPANY } from '#/lib/legal/company'
import { termsMsLocale } from '#/lib/legal/terms-ms'
import { termsZhLocale } from '#/lib/legal/terms-zh'
import { h2, p, ul } from '#/lib/legal/sections'
import type { LegalDocument } from '#/lib/legal/types'

export const termsDocument: LegalDocument = {
  slug: 'terms',
  path: '/terms',
  title: 'Website Terms & Conditions',
  metaTitle: 'Terms & Conditions | XQ Car Rental Langkawi',
  metaDescription:
    'Website terms and conditions for XQ Car Rental, operated by Xiao Qiang Holidays Sdn Bhd in Langkawi, Malaysia.',
  effectiveDate: LEGAL_COMPANY.effectiveDate,
  version: LEGAL_COMPANY.version,
  documentLabel: 'Document 1: Website Terms & Conditions',
  locales: [termsMsLocale, termsZhLocale],
  sections: [
    h2('1. Introduction'),
    p(
      'These Terms and Conditions ("Terms") govern your use of the website, mobile applications, booking systems, and related services operated by Xiao Qiang Holidays Sdn Bhd (Company Registration No. 201301017811), trading as XQ Car Rental ("the Company", "we", "us", or "our").',
    ),
    p(
      'By creating an account, submitting a booking, making payment, or otherwise using our services, you ("the Customer", "you", or "your") confirm that you have read, understood, and agreed to be legally bound by these Terms. If you do not agree, you must discontinue use of the Platform immediately.',
    ),
    p(
      'These Terms apply to website transactions only. Additional terms in the Vehicle Rental Contract apply at the point of vehicle handover and form a separate binding agreement.',
    ),
    h2('2. Definitions'),
    p('In these Terms, the following definitions apply:'),
    ul(
      '"Company" means Xiao Qiang Holidays Sdn Bhd, including its subsidiaries, affiliates, officers, employees, agents, contractors, and fleet partners.',
      '"Customer" means any person or entity accessing the Platform, making a booking, or using any service provided by the Company.',
      '"Vehicle" means any motor vehicle rented, supplied, or coordinated by the Company, including vehicles owned by third-party fleet partners.',
      '"Booking" means any reservation submitted through the Platform, whether confirmed, pending, or rejected.',
      '"Platform" means the Company\'s website, booking systems, applications, communication channels, and related infrastructure.',
      '"Rental Contract" means the separate vehicle rental agreement executed at the point of vehicle handover.',
      '"Rental Period" means the period between the agreed pickup time and the agreed return time as stated in the booking confirmation.',
    ),
    h2('3. Eligibility'),
    p('By making a booking, you represent and warrant that:'),
    ul(
      'You are at least twenty-one (21) years of age.',
      'You have held a valid driving licence for a minimum of one (1) year.',
      'Your driving licence is recognised under Malaysian law, or you possess a valid International Driving Permit (IDP) accompanied by your original licence.',
      'You have legal capacity to enter into binding agreements.',
      'You have not been disqualified from driving by any court, authority, or insurer.',
      'All information you submit is true, accurate, current, and complete.',
    ),
    p(
      'Foreign drivers are solely responsible for ensuring compliance with Malaysian road traffic laws and licence recognition requirements. The Company reserves the right to refuse service if eligibility cannot be verified at vehicle handover.',
    ),
    h2('4. Nature of Services'),
    p(
      'The Company operates as a vehicle rental operator, tourism service provider, and booking platform. Certain vehicles may be supplied by third-party fleet partners under the Company\'s coordination.',
    ),
    p(
      'Vehicle images, descriptions, specifications, colours, and features displayed on the Platform are for illustration only and do not constitute warranties or guarantees of the specific unit you will receive.',
    ),
    p(
      'The Company reserves the right to substitute a booked vehicle with a vehicle of equivalent or higher category at no additional charge. If no equivalent vehicle is available, a full refund will be offered.',
    ),
    h2('5. Booking Formation and Acceptance'),
    p(
      'A booking request submitted through the Platform does not constitute automatic acceptance. A booking becomes a binding contract only upon all of the following:',
    ),
    ul(
      'Successful payment verification.',
      'Identity verification (where required).',
      'Issuance of a written booking confirmation by the Company via email or other electronic means.',
    ),
    p(
      'The Company reserves the right to reject, cancel, or modify any booking at its sole discretion, including for reasons of suspected fraud, payment irregularities, pricing errors, vehicle unavailability, safety concerns, or operational limitations. In such cases, the Customer will be notified and any payment made will be refunded in full.',
    ),
    h2('6. Pricing, Taxes, and Payment'),
    p(
      'All prices are quoted in Malaysian Ringgit (MYR) and are inclusive of Sales and Service Tax (SST) where applicable, unless stated otherwise.',
    ),
    p(
      'Prices are subject to availability, seasonal adjustments, and dynamic pricing. The Company reserves the right to correct pricing errors, typographical mistakes, or system malfunctions at any time, including after a booking has been submitted but before confirmation.',
    ),
    p('Payments processed through the Platform may include:'),
    ul(
      'Rental charges for the agreed Rental Period.',
      'Refundable security deposits.',
      'Delivery or collection charges.',
      'Administrative or processing fees.',
      'Optional add-ons such as additional driver fees or child seat rental.',
    ),
    p(
      'Charges arising during or after the Rental Period (including damage, traffic summons, toll charges, fuel discrepancies, cleaning, and late return fees) are governed by the Rental Contract and may be charged to the Customer\'s payment method on file.',
    ),
    h2('7. Security Deposit and Pre-Authorisation'),
    p(
      'A refundable security deposit or card pre-authorisation may be required before vehicle handover. The amount will be disclosed in the booking confirmation or at the point of handover.',
    ),
    p('The Customer authorises the Company to deduct or recover from the deposit amounts associated with:'),
    ul(
      'Vehicle damage not covered by insurance.',
      'Insurance excess amounts.',
      'Smoking contamination or interior cleaning beyond reasonable wear.',
      'Missing accessories or equipment.',
      'Fuel shortfall and refuelling administrative charges.',
      'Traffic summons, parking fines, and toll charges.',
      'Loss of rental income during vehicle downtime caused by Customer-attributable damage, calculated at the daily rental rate and capped at fourteen (14) days.',
    ),
    p(
      'Deposit release timelines depend on the Customer\'s card issuer and may take five (5) to thirty (30) working days after the Rental Period ends and final reconciliation is complete.',
    ),
    h2('8. Promotional Codes and Discounts'),
    p(
      'Promotional codes, vouchers, and discounts are issued at the Company\'s sole discretion and are subject to the specific terms of each promotion.',
    ),
    p('The Company reserves the right to:'),
    ul(
      'Modify, suspend, or terminate promotions without prior notice.',
      'Reject improperly applied codes.',
      'Reverse discounts arising from system abuse or fraudulent use.',
      'Cancel bookings involving fraudulent promotional activity.',
    ),
    p('Promotions have no cash value, are non-transferable, and cannot be combined unless expressly stated.'),
    h2('9. Customer Account'),
    p(
      'Where the Platform offers account creation, you are responsible for maintaining the confidentiality of your login credentials and for all activity conducted under your account.',
    ),
    p(
      'You must notify the Company immediately of any unauthorised access. The Company is not liable for losses arising from your failure to safeguard your account.',
    ),
    h2('10. Limitation of Liability'),
    p('To the fullest extent permitted by Malaysian law, the Company excludes liability for:'),
    ul(
      'Indirect, incidental, or consequential damages.',
      'Loss of profits, business opportunity, or anticipated savings.',
      'Missed travel arrangements, flights, ferries, or accommodation.',
      'Emotional distress or reputational damage.',
      'Loss of data or service interruption.',
    ),
    p(
      'Where liability cannot be excluded under applicable law (including for personal injury or death caused by negligence), the Company\'s total aggregate liability shall not exceed the total amount paid by the Customer for the relevant booking.',
    ),
    p(
      'Nothing in these Terms limits any right that cannot lawfully be limited under the Consumer Protection Act 1999 (Malaysia).',
    ),
    h2('11. Indemnification'),
    p('You agree to indemnify, defend, and hold harmless the Company against all claims, losses, damages, penalties, costs, and legal fees arising from:'),
    ul(
      'Your breach of these Terms or the Rental Contract.',
      'Fraudulent conduct or misrepresentation.',
      'Vehicle misuse, negligence, or unauthorised driving.',
      'Violations of law committed during the Rental Period.',
      'Injury or damage caused to third parties by your acts or omissions.',
    ),
    h2('12. Force Majeure'),
    p(
      'The Company shall not be liable for any failure or delay in performance arising from events beyond its reasonable control, including natural disasters, floods, pandemics, government restrictions, civil unrest, ferry or transport disruptions, supplier failures, or cyber incidents.',
    ),
    p(
      'In a force majeure event, the Company will make reasonable efforts to reschedule the booking or issue a refund where rescheduling is not feasible.',
    ),
    h2('13. Electronic Communications'),
    p(
      'You agree that electronic records, emails, WhatsApp messages, online acknowledgments, digital signatures, and uploaded documents constitute valid legal communications and enforceable agreements under the Electronic Commerce Act 2006 and Digital Signature Act 1997 (Malaysia).',
    ),
    p('Digital records maintained by the Company may be used as evidence in any dispute or enforcement proceeding.'),
    h2('14. Intellectual Property'),
    p(
      'All content on the Platform, including text, graphics, logos, images, photographs, and software, is owned by or licensed to the Company and is protected under Malaysian and international copyright and trademark laws.',
    ),
    p(
      'You may not copy, reproduce, modify, distribute, or commercially exploit any content from the Platform without the Company\'s prior written consent.',
    ),
    h2('15. Third-Party Suppliers'),
    p(
      'The Company may source vehicles or services from third-party fleet partners and operators. While the Company exercises reasonable care in selecting partners, it shall not be liable for supplier operational failures, mechanical issues beyond reasonable control, or third-party acts or omissions.',
    ),
    h2('16. Governing Law and Jurisdiction'),
    p(
      'These Terms shall be governed by and construed in accordance with the laws of Malaysia. Any dispute arising from or relating to these Terms or the use of the Platform shall be subject to the exclusive jurisdiction of the courts of Malaysia.',
    ),
    h2('17. Severability and Waiver'),
    p(
      'If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
    ),
    p(
      'Failure by the Company to enforce any provision does not constitute a waiver of that provision or of any other right or remedy.',
    ),
    h2('18. Amendments'),
    p(
      'The Company reserves the right to amend these Terms at any time. Material changes will be notified through the Platform or by email. Continued use of the Platform after amendments take effect constitutes acceptance of the revised Terms.',
    ),
    p('Each version of these Terms is identified by an effective date. The version in force at the time of booking governs that booking.'),
    h2('19. Contact'),
    p('For questions, complaints, or notices relating to these Terms, contact:'),
    p(`${LEGAL_COMPANY.name}\n${LEGAL_COMPANY.address}\nWebsite: ${LEGAL_COMPANY.website}`),
  ],
}
