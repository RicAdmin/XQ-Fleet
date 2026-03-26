import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

// ─── Brand colours ────────────────────────────────────────────────────────────

const AMBER = '#a06208'
const INK = '#1a1916'
const INK_SOFT = '#6b6760'
const LINE = '#e8e7e4'
const SURFACE = '#faf9f7'

// ─── Shared styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: INK,
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.4,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: AMBER,
  },
  logo: { width: 48, height: 48, objectFit: 'contain' },
  companyBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: AMBER, marginBottom: 2 },
  docMeta: { fontSize: 8, color: INK_SOFT },

  // Section
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: AMBER,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },

  // Two-column grid
  grid2: { flexDirection: 'row', gap: 24 },
  col: { flex: 1 },

  // Label + value pair
  fieldRow: { marginBottom: 6 },
  label: { fontSize: 7, color: INK_SOFT, marginBottom: 1.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  value: { fontSize: 9, color: INK },

  // Divider
  divider: { borderTopWidth: 0.5, borderTopColor: LINE, marginVertical: 12 },

  // Highlighted summary box
  summaryBox: {
    backgroundColor: SURFACE,
    borderWidth: 0.5,
    borderColor: LINE,
    borderRadius: 4,
    padding: 12,
    marginTop: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryLabel: { color: INK_SOFT },
  summaryValue: { fontFamily: 'Helvetica-Bold', color: INK },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: LINE },
  summaryTotalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  summaryTotalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: AMBER },

  // Signature block
  sigSection: { flexDirection: 'row', gap: 40, marginTop: 32 },
  sigBlock: { flex: 1 },
  sigLine: { borderTopWidth: 0.5, borderTopColor: INK, marginTop: 36, marginBottom: 4 },
  sigLabel: { fontSize: 8, color: INK_SOFT },

  // Invoice table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: INK,
    color: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  tableRowAlt: { backgroundColor: SURFACE },
  colDesc: { flex: 3 },
  colNum: { flex: 1, textAlign: 'right' },

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 4,
  },
  statusText: { fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: INK_SOFT },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round(Math.abs(b.getTime() - a.getTime()) / 86400000))
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export type DocumentData = {
  rentalId: string
  type: string
  status: string
  paymentStatus: string
  startDate: Date
  endDate: Date
  actualReturnDate: Date | null
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
  paidAmountSen: number
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  carYear: number | null
  carCategory: string | null
  customerFullName: string | null
  customerIcOrPassport: string | null
  customerPhone: string | null
  customerAddress: string | null
  logoPath: string
  generatedAt: Date
}

// ─── Rental Agreement Document ────────────────────────────────────────────────

export function RentalAgreementDocument({ data }: { data: DocumentData }) {
  const rentalDays = daysBetween(data.startDate, data.endDate)

  return (
    <Document title={`Rental Agreement — ${data.carPlateNumber ?? ''}`} author="XQ Car Fleet">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Image src={data.logoPath} style={s.logo} />
          <View style={s.companyBlock}>
            <Text style={s.docTitle}>RENTAL AGREEMENT</Text>
            <Text style={s.docMeta}>XQ Car Fleet, Langkawi</Text>
            <Text style={s.docMeta}>Ref: {shortId(data.rentalId)}</Text>
            <Text style={s.docMeta}>Date: {fmtDate(data.generatedAt)}</Text>
          </View>
        </View>

        {/* ── Vehicle & Customer (side by side) ── */}
        <View style={[s.grid2, { marginBottom: 18 }]}>
          {/* Vehicle */}
          <View style={s.col}>
            <Text style={s.sectionTitle}>Vehicle</Text>
            <View style={s.fieldRow}>
              <Text style={s.label}>PLATE NUMBER</Text>
              <Text style={[s.value, { fontSize: 11, fontFamily: 'Helvetica-Bold' }]}>
                {data.carPlateNumber ?? '—'}
              </Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>MAKE / MODEL</Text>
              <Text style={s.value}>{data.carMake} {data.carModel}</Text>
            </View>
            {data.carYear && (
              <View style={s.fieldRow}>
                <Text style={s.label}>YEAR</Text>
                <Text style={s.value}>{data.carYear}</Text>
              </View>
            )}
            <View style={s.fieldRow}>
              <Text style={s.label}>CATEGORY</Text>
              <Text style={[s.value, { textTransform: 'capitalize' }]}>{data.carCategory ?? '—'}</Text>
            </View>
          </View>

          {/* Customer */}
          <View style={s.col}>
            <Text style={s.sectionTitle}>Customer</Text>
            <View style={s.fieldRow}>
              <Text style={s.label}>FULL NAME</Text>
              <Text style={[s.value, { fontFamily: 'Helvetica-Bold' }]}>{data.customerFullName ?? '—'}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>IC / PASSPORT</Text>
              <Text style={s.value}>{data.customerIcOrPassport ?? '—'}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>PHONE</Text>
              <Text style={s.value}>{data.customerPhone ?? '—'}</Text>
            </View>
            {data.customerAddress && (
              <View style={s.fieldRow}>
                <Text style={s.label}>ADDRESS</Text>
                <Text style={s.value}>{data.customerAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Rental Terms ── */}
        <Text style={s.sectionTitle}>Rental Terms</Text>
        <View style={s.grid2}>
          <View style={s.col}>
            <View style={s.fieldRow}>
              <Text style={s.label}>RENTAL TYPE</Text>
              <Text style={[s.value, { textTransform: 'capitalize' }]}>{data.type}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>PICKUP DATE</Text>
              <Text style={s.value}>{fmtDate(data.startDate)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>RETURN DATE</Text>
              <Text style={s.value}>{fmtDate(data.endDate)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>DURATION</Text>
              <Text style={s.value}>{rentalDays} day{rentalDays !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={s.col}>
            <View style={s.summaryBox}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Daily rate</Text>
                <Text style={s.summaryValue}>{fmt(data.dailyRateSen)}/day</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Duration</Text>
                <Text style={s.summaryValue}>{rentalDays} day{rentalDays !== 1 ? 's' : ''}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Deposit</Text>
                <Text style={s.summaryValue}>{fmt(data.depositAmountSen)}</Text>
              </View>
              <View style={s.summaryTotal}>
                <Text style={s.summaryTotalLabel}>Total</Text>
                <Text style={s.summaryTotalValue}>{fmt(data.totalAmountSen)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Terms & Conditions ── */}
        <View style={[s.section, { marginTop: 18 }]}>
          <Text style={s.sectionTitle}>Terms &amp; Conditions</Text>
          <View style={{ fontSize: 8, color: INK_SOFT, gap: 4 }}>
            <Text>1. The vehicle must be returned in the same condition as at the time of pickup, including fuel level.</Text>
            <Text>2. The renter is responsible for all traffic fines, toll charges, and parking fees incurred during the rental period.</Text>
            <Text>3. In the event of an accident or damage to the vehicle, the renter must notify the company immediately.</Text>
            <Text>4. The deposit will be refunded upon satisfactory return of the vehicle, less any applicable deductions.</Text>
            <Text>5. The company reserves the right to charge the renter for any damage beyond normal wear and tear.</Text>
            <Text>6. Returning the vehicle late without prior arrangement may incur additional daily charges.</Text>
          </View>
        </View>

        {/* ── Signatures ── */}
        <View style={s.sigSection}>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Customer Signature</Text>
            <Text style={[s.sigLabel, { marginTop: 3 }]}>{data.customerFullName ?? ''}</Text>
            <Text style={[s.sigLabel, { marginTop: 3 }]}>Date: ___________________</Text>
          </View>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Company Representative</Text>
            <Text style={[s.sigLabel, { marginTop: 3 }]}>XQ Car Fleet, Langkawi</Text>
            <Text style={[s.sigLabel, { marginTop: 3 }]}>Date: ___________________</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>XQ Car Fleet, Langkawi · Ref: {shortId(data.rentalId)}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

// ─── Invoice Document ─────────────────────────────────────────────────────────

export function InvoiceDocument({ data }: { data: DocumentData }) {
  const rentalDays = daysBetween(data.startDate, data.endDate)
  const balance = data.totalAmountSen - data.paidAmountSen
  const returnDate = data.actualReturnDate ?? data.endDate

  const paymentStatus = balance <= 0 ? 'PAID' : data.paidAmountSen > 0 ? 'PARTIAL' : 'UNPAID'
  const statusColors: Record<string, { bg: string; text: string }> = {
    PAID:    { bg: '#e8f8ef', text: '#1d7a45' },
    PARTIAL: { bg: '#fdf7ed', text: '#b07020' },
    UNPAID:  { bg: '#fdf1f1', text: '#c44444' },
  }
  const statusColor = statusColors[paymentStatus]

  return (
    <Document title={`Invoice — ${data.carPlateNumber ?? ''}`} author="XQ Car Fleet">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Image src={data.logoPath} style={s.logo} />
          <View style={s.companyBlock}>
            <Text style={s.docTitle}>INVOICE</Text>
            <Text style={s.docMeta}>XQ Car Fleet, Langkawi</Text>
            <Text style={s.docMeta}>Invoice #: {shortId(data.rentalId)}</Text>
            <Text style={s.docMeta}>Date: {fmtDate(data.generatedAt)}</Text>
          </View>
        </View>

        {/* ── Bill To + Vehicle (side by side) ── */}
        <View style={[s.grid2, { marginBottom: 20 }]}>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Bill To</Text>
            <View style={s.fieldRow}>
              <Text style={[s.value, { fontFamily: 'Helvetica-Bold', fontSize: 10 }]}>{data.customerFullName ?? '—'}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>IC / PASSPORT</Text>
              <Text style={s.value}>{data.customerIcOrPassport ?? '—'}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>PHONE</Text>
              <Text style={s.value}>{data.customerPhone ?? '—'}</Text>
            </View>
            {data.customerAddress && (
              <View style={s.fieldRow}>
                <Text style={s.label}>ADDRESS</Text>
                <Text style={s.value}>{data.customerAddress}</Text>
              </View>
            )}
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Vehicle</Text>
            <View style={s.fieldRow}>
              <Text style={[s.value, { fontFamily: 'Helvetica-Bold', fontSize: 11 }]}>{data.carPlateNumber ?? '—'}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>MAKE / MODEL</Text>
              <Text style={s.value}>{data.carMake} {data.carModel}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>RETURN DATE</Text>
              <Text style={s.value}>{fmtDate(returnDate)}</Text>
            </View>
          </View>
        </View>

        {/* ── Line items table ── */}
        <Text style={s.sectionTitle}>Charges</Text>
        <View style={s.tableHeader}>
          <Text style={[s.colDesc, { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Description</Text>
          <Text style={[s.colNum, { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Days</Text>
          <Text style={[s.colNum, { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Rate</Text>
          <Text style={[s.colNum, { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Amount</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.colDesc}>
            Car Rental — {data.carPlateNumber} {data.carMake} {data.carModel}
            {'\n'}
            <Text style={{ fontSize: 8, color: INK_SOFT }}>
              {fmtDate(data.startDate)} → {fmtDate(data.endDate)}
            </Text>
          </Text>
          <Text style={s.colNum}>{rentalDays}</Text>
          <Text style={s.colNum}>{fmt(data.dailyRateSen)}</Text>
          <Text style={[s.colNum, { fontFamily: 'Helvetica-Bold' }]}>{fmt(data.dailyRateSen * rentalDays)}</Text>
        </View>

        {/* ── Totals ── */}
        <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
          <View style={{ width: 220 }}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryValue}>{fmt(data.totalAmountSen)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Deposit received</Text>
              <Text style={s.summaryValue}>− {fmt(data.depositAmountSen)}</Text>
            </View>
            {data.paidAmountSen > 0 && data.paidAmountSen !== data.depositAmountSen && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Additional payment</Text>
                <Text style={s.summaryValue}>− {fmt(Math.max(0, data.paidAmountSen - data.depositAmountSen))}</Text>
              </View>
            )}
            <View style={[s.summaryTotal, { borderTopColor: AMBER, borderTopWidth: 1 }]}>
              <Text style={s.summaryTotalLabel}>Balance due</Text>
              <Text style={[s.summaryTotalValue, { color: balance > 0 ? '#c44444' : AMBER }]}>
                {fmt(Math.max(0, balance))}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Payment status badge ── */}
        <View style={[s.statusBadge, { backgroundColor: statusColor.bg, marginTop: 14 }]}>
          <Text style={[s.statusText, { color: statusColor.text }]}>
            Payment status: {paymentStatus}
          </Text>
        </View>

        {/* ── Rental details summary ── */}
        <View style={[s.divider, { marginTop: 20 }]} />
        <View style={s.grid2}>
          <View style={s.col}>
            <View style={s.fieldRow}>
              <Text style={s.label}>RENTAL PERIOD</Text>
              <Text style={s.value}>{fmtDate(data.startDate)} → {fmtDate(data.endDate)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>ACTUAL RETURN</Text>
              <Text style={s.value}>{fmtDate(data.actualReturnDate)}</Text>
            </View>
          </View>
          <View style={s.col}>
            <View style={s.fieldRow}>
              <Text style={s.label}>TOTAL CHARGED</Text>
              <Text style={s.value}>{fmt(data.totalAmountSen)}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.label}>TOTAL PAID</Text>
              <Text style={[s.value, { fontFamily: 'Helvetica-Bold' }]}>{fmt(data.paidAmountSen)}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>XQ Car Fleet, Langkawi · Invoice #{shortId(data.rentalId)}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
