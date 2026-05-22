import { LEGAL_COMPANY } from '#/lib/legal/company'
import { h2, h3, p, table, ul } from '#/lib/legal/sections'
import type { LegalDocument } from '#/lib/legal/types'

export const refundPolicyDocument: LegalDocument = {
  slug: 'refund-policy',
  path: '/refund-policy',
  title: 'Cancellation & Refund Policy',
  metaTitle: 'Cancellation & Refund Policy | XQ Car Rental Langkawi',
  metaDescription:
    'Cancellation and refund terms for XQ Car Rental bookings in Langkawi — refund schedule, no-show policy, and processing timelines.',
  effectiveDate: LEGAL_COMPANY.effectiveDate,
  version: LEGAL_COMPANY.version,
  documentLabel: 'Document 4: Cancellation & Refund Policy',
  sections: [
    h2('1. Application'),
    p(
      'This Cancellation & Refund Policy applies to all bookings made through the XQ Car Rental Platform operated by Xiao Qiang Holidays Sdn Bhd. It forms part of the contract between you and the Company and should be read together with the Website Terms & Conditions.',
    ),
    h2('2. Cancellation by the Customer'),
    p(
      'Cancellations must be submitted in writing via email or through the Platform\'s cancellation function. The cancellation is effective on the date the Company receives the written request, calculated against the scheduled pickup date and time stated in the booking confirmation.',
    ),
    h3('2.1 Refund Schedule'),
    p('The following refund schedule applies:'),
    table(
      ['Time of Cancellation (before pickup)', 'Refund'],
      [
        ['14 days or more', '100% refund of rental charges'],
        ['7 to 13 days', '50% refund of rental charges'],
        ['Less than 7 days', 'No refund'],
        ['No-show on pickup day', 'No refund'],
      ],
    ),
    h3('2.2 Administrative Fee'),
    p(
      'All refunds are subject to a non-refundable administrative fee of RM 30 to cover payment processing costs. Refunds are processed net of this fee.',
    ),
    h3('2.3 Non-Refundable Charges'),
    p('The following are non-refundable regardless of cancellation timing:'),
    ul(
      'Booking fees and platform charges, where applicable.',
      'Delivery and collection fees already incurred.',
      'Payment gateway and bank transfer charges.',
      'Promotional or discounted bookings expressly marked as non-refundable at the time of booking.',
    ),
    h2('3. No-Show'),
    p(
      'If the Customer fails to arrive for vehicle pickup within four (4) hours of the scheduled pickup time without prior notice, the booking is automatically forfeited and no refund will be issued. The Vehicle is released for re-rental after this period.',
    ),
    h2('4. Modification of Bookings'),
    p('Modifications to bookings (change of dates, vehicle category, pickup location) are permitted subject to availability and may be subject to price adjustment:'),
    ul(
      'Modifications requested 14 or more days before pickup: free of charge, subject to availability.',
      'Modifications requested 7 to 13 days before pickup: subject to a modification fee of RM 50 and price differential.',
      'Modifications requested less than 7 days before pickup: treated as a new booking and a cancellation of the original.',
    ),
    p('Modifications resulting in a reduced total are not refunded the difference once within the 7-day window.'),
    h2('5. Early Return'),
    p(
      'Returning the Vehicle before the agreed return time does not entitle the Customer to a refund of unused rental days unless agreed in writing in advance.',
    ),
    h2('6. Cancellation by the Company'),
    p(
      'In the rare event that the Company cancels a confirmed booking for any reason within its control (including vehicle unavailability where no equivalent substitute exists), the Customer will receive:',
    ),
    ul(
      'A full refund of all amounts paid, including any administrative fees.',
      'Where reasonably possible, an offer of an alternative vehicle of equivalent or higher category at the original price.',
    ),
    p(
      'The Company\'s liability for such cancellation is limited to the amount paid by the Customer for the booking. The Company is not liable for consequential losses such as missed flights, ferry connections, accommodation costs, or alternative transport arrangements.',
    ),
    h2('7. Force Majeure Cancellations'),
    p(
      'Where a booking cannot be fulfilled due to a force majeure event (including natural disasters, floods, pandemics, government restrictions, civil unrest, ferry disruption affecting Langkawi access, or other events beyond reasonable control), the Company will:',
    ),
    ul(
      'Offer to reschedule the booking to a mutually acceptable date within six (6) months, free of modification charges.',
      'Where rescheduling is not feasible, provide a full refund net of unrecoverable third-party charges (such as payment gateway fees).',
    ),
    h2('8. Refund Method and Timing'),
    p('Refunds are processed to the original payment method used for the booking. Processing timelines are:'),
    ul(
      'Credit and debit cards: 7 to 21 working days, depending on the card issuer.',
      'Bank transfer (FPX, online banking): 5 to 14 working days.',
      'E-wallet and other digital payment methods: 3 to 10 working days.',
    ),
    p(
      'The Company is not liable for delays caused by financial institutions or payment processors. The Customer is responsible for any currency conversion losses.',
    ),
    h2('9. Disputed Charges and Chargebacks'),
    p(
      'Customers are required to contact the Company first to resolve any payment dispute before initiating a chargeback with their card issuer. Initiating an unwarranted chargeback may result in:',
    ),
    ul(
      'Suspension of the Customer\'s account.',
      'Recovery action for the disputed amount plus chargeback fees.',
      'Reporting to fraud prevention databases where applicable.',
    ),
    h2('10. Contact'),
    p(
      'Cancellation and refund requests should be sent to the Company at the address listed on our website, with the booking reference number clearly stated.',
    ),
  ],
}
