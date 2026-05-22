export const LEGAL_COMPANY = {
  name: 'Xiao Qiang Holidays Sdn Bhd',
  tradingAs: 'XQ Car Rental',
  registrationNo: '201301017811',
  kpkLn: 'KPK/LN: 7371',
  ma: 'MA4659',
  address: '26 & 28, 1st Floor, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia',
  website: 'xqholidays.com.my',
  effectiveDate: '22 May 2026',
  version: '1.0',
} as const

export const LEGAL_PACK_INTRO = [
  'Operated by Xiao Qiang Holidays Sdn Bhd',
  `Company Registration No. ${LEGAL_COMPANY.registrationNo}`,
  `${LEGAL_COMPANY.kpkLn}  |  ${LEGAL_COMPANY.ma}`,
  LEGAL_COMPANY.address,
] as const
