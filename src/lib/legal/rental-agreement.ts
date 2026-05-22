import { LEGAL_COMPANY } from '#/lib/legal/company'
import { rentalAgreementMsLocale } from '#/lib/legal/rental-agreement-ms'
import { rentalAgreementZhLocale } from '#/lib/legal/rental-agreement-zh'
import { h2, p, signature, ul } from '#/lib/legal/sections'
import type { LegalDocument } from '#/lib/legal/types'

export const rentalAgreementDocument: LegalDocument = {
  slug: 'rental-agreement',
  path: '/rental-agreement',
  title: 'Vehicle Rental Contract',
  metaTitle: 'Vehicle Rental Contract | XQ Car Rental Langkawi',
  metaDescription:
    'Vehicle rental contract for XQ Car Rental in Langkawi — eligibility, usage rules, insurance, fuel policy, and renter obligations.',
  effectiveDate: LEGAL_COMPANY.effectiveDate,
  version: LEGAL_COMPANY.version,
  documentLabel: 'Document 2: Vehicle Rental Contract',
  locales: [rentalAgreementMsLocale, rentalAgreementZhLocale],
  sections: [
    h2('1. Parties and Application'),
    p(
      'This Vehicle Rental Contract ("Contract") is entered into between Xiao Qiang Holidays Sdn Bhd (Company Registration No. 201301017811), trading as XQ Car Rental ("the Company"), and the named renter identified in the booking confirmation and vehicle handover record ("the Renter").',
    ),
    p(
      'This Contract takes effect at the point of vehicle handover and remains in force until the Vehicle is returned to the Company and final reconciliation of charges is completed. It operates in addition to the Website Terms & Conditions and prevails in case of conflict regarding the rental itself.',
    ),
    h2('2. Driver Eligibility'),
    p('The Renter and any authorised additional driver must:'),
    ul(
      'Be at least twenty-one (21) years of age.',
      'Hold a valid driving licence that has been issued for at least one (1) year.',
      'Possess a valid International Driving Permit (IDP) if the licence is issued outside Malaysia and is not in English.',
      'Present the original physical licence and a government-issued photo identification (passport or MyKad) at vehicle handover.',
    ),
    p(
      'Only persons declared and approved by the Company are permitted to drive the Vehicle. Allowing any unauthorised person to drive voids insurance coverage and renders the Renter fully liable for any resulting loss or damage.',
    ),
    h2('3. Rental Period'),
    p(
      'The Rental Period begins at the agreed pickup time and ends at the agreed return time as stated in the booking confirmation.',
    ),
    p(
      'Rental charges are calculated on a 24-hour basis from the pickup time. A grace period of sixty (60) minutes is granted for late return. Returns beyond the grace period are charged as follows:',
    ),
    ul(
      '61 minutes to 4 hours late: 25% of the daily rental rate.',
      '4 to 8 hours late: 50% of the daily rental rate.',
      'Beyond 8 hours late: full daily rental rate per 24-hour block.',
    ),
    p(
      'Extensions to the Rental Period must be requested and confirmed in writing by the Company at least four (4) hours before the scheduled return time. Approval is subject to vehicle availability.',
    ),
    h2('4. Pickup, Delivery, and Return'),
    p(
      'Standard pickup and return location is the Company\'s office at 26 & 28, 1st Floor, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi.',
    ),
    p(
      'Delivery and collection at other locations on Langkawi Island (including airport, ferry terminal, and hotels) may be arranged subject to availability and applicable charges disclosed at booking.',
    ),
    p('After-hours pickup or return must be pre-arranged and is subject to an after-hours service fee.'),
    p(
      'Both parties shall conduct a joint inspection of the Vehicle at handover and at return. The Renter is encouraged to take photographs at both points. Any damage not noted at handover but identified at return is presumed to have occurred during the Rental Period unless the Renter can demonstrate otherwise.',
    ),
    h2('5. Geographic Restriction (Langkawi Only)'),
    p('The Vehicle is strictly for use within the island of Langkawi. The Renter shall not, under any circumstances:'),
    ul(
      'Transport the Vehicle by ferry, barge, or any other means to mainland Malaysia or any other island.',
      'Permit the Vehicle to be driven onto any ferry or vessel.',
      'Take the Vehicle outside the geographic boundaries of Langkawi.',
    ),
    p('Any breach of this clause constitutes a fundamental breach of this Contract. The Renter shall be liable for:'),
    ul(
      'A penalty of RM 2,000 per occurrence.',
      'All recovery costs incurred by the Company.',
      'Full liability for any damage, loss, or theft of the Vehicle during the period of unauthorised use, with insurance coverage voided.',
      'Loss of rental income during recovery.',
    ),
    h2('6. Permitted and Prohibited Use'),
    p('The Vehicle may only be used for lawful, private, non-commercial transportation within Langkawi.'),
    p('The Renter shall not use the Vehicle for any of the following:'),
    ul(
      'Illegal purposes of any kind.',
      'Racing, rallies, speed tests, or any motorsport activity.',
      'Commercial passenger transport, taxi services, or ride-sharing platforms (including but not limited to Grab, AirAsia ride, or InDrive).',
      'Driving instruction or driver training.',
      'Towing of any vehicle, trailer, or object.',
      'Carrying passengers or cargo exceeding the Vehicle\'s rated capacity.',
      'Off-road driving, including beach driving.',
      'Transporting hazardous, flammable, or prohibited substances.',
      'Smuggling, trafficking, or any activity in breach of Malaysian law.',
      'Driving while under the influence of alcohol, drugs, or any substance that impairs driving ability.',
    ),
    h2('7. Fuel Policy'),
    p(
      'The Vehicle is provided with a full tank of fuel and must be returned with a full tank of the same fuel grade specified on the handover record.',
    ),
    p('If the Vehicle is returned with less than a full tank, the Renter will be charged:'),
    ul(
      'The cost of the shortfall at prevailing retail pump price.',
      'A refuelling administrative fee of RM 50.',
    ),
    p(
      'Use of incorrect fuel grade is the Renter\'s full responsibility, including all repair costs, towing, and loss of rental income.',
    ),
    h2('8. Mileage'),
    p(
      'Mileage is unlimited within Langkawi for the duration of the Rental Period, subject to the geographic restriction in Clause 5.',
    ),
    h2('9. Tolls, Touch \'n Go, and Parking'),
    p(
      'The Renter is responsible for all toll charges, electronic toll deductions, parking fees, and parking penalties incurred during the Rental Period.',
    ),
    p(
      'Where a Touch \'n Go card is provided, the Renter is responsible for maintaining sufficient balance and for any toll charges deducted. The card must be returned at the end of the Rental Period.',
    ),
    p(
      'Outstanding toll or parking charges identified after vehicle return will be charged to the Renter\'s payment method, with an administrative fee of RM 50 per transaction.',
    ),
    h2('10. Traffic Summons and Fines'),
    p(
      'The Renter is fully responsible for all traffic summons, compounds, and fines issued in respect of the Vehicle during the Rental Period, regardless of when the Company is notified by the relevant authority.',
    ),
    p(
      'The Company will charge the original summons amount plus an administrative processing fee of RM 50 per summons. The Renter retains the right to dispute the summons directly with the issuing authority.',
    ),
    h2('11. Smoking, Pets, and Cleanliness'),
    p('Smoking, vaping, and the use of e-cigarettes inside the Vehicle are strictly prohibited.'),
    p('Pets are not permitted inside the Vehicle without prior written approval.'),
    p('Charges for breach of this clause:'),
    ul(
      'Smoking or vaping inside the Vehicle: RM 500 deep cleaning and deodorising fee.',
      'Unauthorised pet transport: RM 300 cleaning fee.',
      'Excessive soiling, sand, mud, food, or liquid spillage requiring professional cleaning: RM 150 to RM 500 depending on severity.',
    ),
    h2('12. Vehicle Condition and Maintenance'),
    p('The Renter shall:'),
    ul(
      'Exercise reasonable care in operating and storing the Vehicle.',
      'Comply with all Malaysian road traffic laws.',
      'Monitor dashboard warning indicators and stop driving immediately if a warning light appears.',
      'Check engine oil, coolant, and tyre condition for rentals exceeding seven (7) days.',
      'Use only the fuel grade specified at handover.',
      'Lock the Vehicle and secure all windows when unattended.',
      'Not leave the keys in the Vehicle when unattended.',
    ),
    p(
      'The Renter is liable for damage caused by neglect of these duties, including engine damage from continuing to drive with warning lights illuminated.',
    ),
    h2('13. Accidents, Theft, Damage, and Breakdown'),
    p('In the event of an accident, theft, breakdown, seizure, or damage, the Renter must:'),
    ul(
      'Stop driving immediately and ensure safety of all persons.',
      'Notify the Company by phone within thirty (30) minutes of the incident.',
      'Lodge a police report within twenty-four (24) hours for any accident, theft, or damage involving third parties.',
      'Preserve all evidence, including photographs of the scene, vehicles involved, and any documentation.',
      'Obtain contact and insurance details of all parties involved.',
      'Not admit liability or make any settlement offer to any party.',
      'Not authorise any repair without the Company\'s prior written consent.',
      'Cooperate fully with the Company, insurers, and authorities.',
    ),
    p(
      'Failure to comply with these procedures may result in denial of insurance coverage and imposition of full financial responsibility on the Renter.',
    ),
    h2('14. Insurance and Liability'),
    p(
      'The Vehicle is covered by third-party motor insurance as required under Malaysian law. Comprehensive coverage and Collision Damage Waiver (CDW) options, where offered, are subject to insurer terms, deductibles, and excess amounts disclosed at booking.',
    ),
    p('Insurance does NOT cover, and the Renter remains fully liable for:'),
    ul(
      'Damage caused by driving under the influence of alcohol or drugs.',
      'Damage caused by unauthorised drivers.',
      'Damage from reckless, negligent, or illegal driving.',
      'Tyre, rim, and wheel damage (puncture, sidewall, kerb damage).',
      'Windscreen, window, and mirror damage.',
      'Underbody damage from off-road driving, flooded roads, or speed bumps taken at excessive speed.',
      'Interior damage, water ingress, and damage from leaving windows open.',
      'Damage occurring during unauthorised geographic use (Clause 5).',
      'Loss of personal belongings inside the Vehicle.',
      'Single-vehicle incidents with no police report.',
    ),
    p(
      'The Renter is liable for the insurance excess amount disclosed at booking for any insured loss, regardless of fault.',
    ),
    h2('15. Lockout, Lost Key, and Roadside Assistance'),
    p('Basic roadside assistance for mechanical breakdown is included within Langkawi during business hours.'),
    p('Charges apply for:'),
    ul(
      'Lost or damaged key: RM 500 to RM 2,500 depending on vehicle model.',
      'Lockout assistance: RM 100 within business hours, RM 200 after hours.',
      'Wrong fuel callout: cost of draining and refilling plus RM 200 service charge.',
      'Flat tyre callout from kerb or pothole damage: RM 150 service charge plus tyre replacement cost.',
    ),
    h2('16. Additional Drivers, Child Seats, and Accessories'),
    p('Additional drivers must be declared and approved before driving. An additional driver fee may apply.'),
    p(
      'Child seats and other accessories are provided subject to availability and applicable rental charges. The Renter is responsible for correct installation and use, and is liable for loss or damage.',
    ),
    h2('17. Early Return'),
    p(
      'Early return of the Vehicle does not entitle the Renter to a refund of unused days unless agreed in writing in advance.',
    ),
    h2('18. Repossession'),
    p('The Company may repossess the Vehicle without notice in the event of:'),
    ul(
      'Breach of any material term of this Contract.',
      'Suspected unauthorised geographic use.',
      'Suspected fraud or false identity.',
      'Non-payment of any due amount.',
      'Vehicle being used in a manner that endangers safety or risks loss.',
    ),
    p('All repossession costs are payable by the Renter.'),
    h2('19. Signature and Acceptance'),
    p(
      'By signing the vehicle handover record, the Renter confirms acceptance of this Contract and acknowledges receipt of the Vehicle in the condition recorded.',
    ),
    signature(
      'Renter Name: _______________________________________________',
      'IC / Passport No.: ___________________________________________',
      'Driving Licence No.: _________________________________________',
      'Signature: __________________________________________________',
      'Date: ______________________________________________________',
      '',
      'For and on behalf of Xiao Qiang Holidays Sdn Bhd',
      'Authorised Representative: ____________________________________',
      'Signature: __________________________________________________',
      'Date: ______________________________________________________',
    ),
  ],
}
