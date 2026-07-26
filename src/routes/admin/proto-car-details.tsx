/**
 * PROTOTYPE — throwaway. Answers: "what should the car details page tabs
 * look like, and how should content be regrouped into them?"
 * Mock data only, no DB calls. Delete once the design question is settled.
 * Run: pnpm dev, then visit /admin/proto-car-details
 */
import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import {
  FileText,
  History,
  LayoutGrid,
  Pencil,
  Wrench,
} from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin/proto-car-details')({
  validateSearch: (search: Record<string, unknown>): { variant?: TabVariant } => ({
    variant:
      search.variant === 'pill' || search.variant === 'boxed' || search.variant === 'icon'
        ? search.variant
        : undefined,
  }),
  component: ProtoCarDetailsPage,
})

// ─── Mock data (no DB calls — this is a throwaway UI prototype) ────────────

const mockCar = {
  id: 'proto-car-1',
  plateNumber: 'WXY 1234',
  make: 'Perodua',
  model: 'Myvi',
  year: 2023,
  color: 'Silver',
  category: 'Economy',
  status: 'available' as const,
  dailyRateSen: 12000,
  currentMileage: 18420,
  notes: 'Slight scratch on rear bumper, noted at last inspection.',
  updatedAt: new Date('2026-07-20'),
}

const mockServiceConfig = {
  serviceIntervalKm: 5000,
  serviceIntervalDays: 180,
  alertBeforeKm: 500,
  alertBeforeDays: 7,
  roadTaxExpiryDate: new Date('2026-11-02'),
  roadTaxPolicyRef: 'RT-88213',
  insuranceExpiryDate: new Date('2026-09-15'),
  insurancePolicyRef: 'INS-XQ-4471',
}

const mockMaintenanceEvents = [
  { id: 'e1', date: 'Jun 12, 2026', type: 'Scheduled', description: 'Oil change + inspection · Ah Kow Workshop', mileage: '15,200 km', cost: 'RM 180.00', status: 'Done' },
  { id: 'e2', date: 'Jul 18, 2026', type: 'Damage', description: 'Rear bumper scratch repair', mileage: '18,400 km', cost: 'RM 420.00', status: 'Open' },
]

const mockDocuments = [
  { label: 'Road tax', expiry: '2 Nov 2026', ref: 'RT-88213' },
  { label: 'Insurance', expiry: '15 Sep 2026', ref: 'INS-XQ-4471' },
]

const mockRentalHistory = [
  { id: 'r1', customer: 'Aiman Hakim', dates: '3–5 Jul 2026', total: 'RM 240.00', status: 'Completed' },
  { id: 'r2', customer: 'Siti Nadia', dates: '22–24 Jun 2026', total: 'RM 240.00', status: 'Completed' },
  { id: 'r3', customer: 'Wei Ming Tan', dates: '10–12 Jun 2026', total: 'RM 240.00', status: 'Completed' },
]

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

// ─── Tab style variants ─────────────────────────────────────────────────────

type TabVariant = 'pill' | 'boxed' | 'icon'

const TAB_ITEMS = [
  { value: 'overview', label: 'Overview', icon: LayoutGrid },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'documents', label: 'Documents', icon: FileText },
  { value: 'history', label: 'History', icon: History },
]

function VariantTabsList({ variant }: { variant: TabVariant }) {
  if (variant === 'pill') {
    return (
      <TabsList className="h-auto gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] p-1">
        {TAB_ITEMS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium text-[var(--sea-ink-soft)] transition-colors',
              'data-active:bg-[var(--ember)] data-active:text-white data-active:shadow-sm',
            )}
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    )
  }

  if (variant === 'boxed') {
    return (
      <TabsList className="h-auto gap-2 rounded-none bg-transparent p-0">
        {TAB_ITEMS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={cn(
              'rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--sea-ink-soft)]',
              'data-active:border-[var(--ember)] data-active:bg-[var(--ember-wash)] data-active:text-[var(--ember-deep)] data-active:font-semibold',
            )}
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    )
  }

  return (
    <TabsList variant="pill">
      {TAB_ITEMS.map((t) => {
        const Icon = t.icon
        return (
          <TabsTrigger key={t.value} value={t.value}>
            <Icon size={17} />
            {t.label}
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}

const VARIANT_OPTIONS: { value: TabVariant; label: string }[] = [
  { value: 'pill', label: 'Segmented / pill' },
  { value: 'boxed', label: 'Boxed cards' },
  { value: 'icon', label: 'Icon + label' },
]

function ProtoCarDetailsPage() {
  const search = Route.useSearch() as { variant?: TabVariant }
  const navigate = Route.useNavigate()
  const variant = search.variant ?? 'icon'

  const [activeTab, setActiveTab] = useState('overview')

  return (
    <AdminSidebarShell
      user={{ name: 'Prototype Admin', email: 'admin@xqcar.test' }}
      pageTitle="Vehicle profile (prototype)"
    >
      <PageHeader
        variant="detail"
        backLink={{ to: '/admin/cars', label: 'Back to fleet' }}
        title={`${mockCar.make} ${mockCar.model}`}
        description={
          <>
            <span className="island-kicker">
              {mockCar.category.toUpperCase()} · {mockCar.year}
            </span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span className="font-mono text-xs font-semibold text-[var(--lagoon-deep)]">
              {mockCar.plateNumber}
            </span>
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={mockCar.status} size="md" />
            <button type="button" className="button-secondary inline-flex items-center gap-1.5">
              <Pencil size={13} />
              Edit
            </button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)} className="gap-4">
        <VariantTabsList variant={variant} />

        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription className="island-kicker">Vehicle details</CardDescription>
                <CardTitle className="sr-only">Vehicle details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3">
                  {[
                    { label: 'Plate number', value: mockCar.plateNumber },
                    { label: 'Make', value: mockCar.make },
                    { label: 'Model', value: mockCar.model },
                    { label: 'Year', value: mockCar.year },
                    { label: 'Color', value: mockCar.color },
                    { label: 'Category', value: mockCar.category },
                    { label: 'Daily rate', value: formatMYR(mockCar.dailyRateSen) },
                  ].map(({ label, value }) => (
                    <div key={label} className="summary-row">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">{label}</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">{value}</dd>
                    </div>
                  ))}
                </dl>
                {mockCar.notes && (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <p className="mb-1 text-sm font-medium text-[var(--sea-ink-soft)]">Notes</p>
                    <p className="text-sm text-[var(--sea-ink)]">{mockCar.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription className="island-kicker">Current status</CardDescription>
                <CardTitle className="sr-only">Current status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <StatusBadge status={mockCar.status} size="md" />
                  <span className="text-sm text-[var(--sea-ink-soft)]">
                    Last updated {mockCar.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <hr className="my-4 border-[var(--line)]" />
                <p className="island-kicker mb-2">Current mileage</p>
                <p className="text-2xl font-semibold text-[var(--sea-ink)]">
                  {mockCar.currentMileage.toLocaleString()} km
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-(--card-spacing)">
              <p className="island-kicker mb-3">Photos</p>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Photo gallery renders here (unchanged from current implementation).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardDescription className="island-kicker">Service & Documents</CardDescription>
                <CardTitle>Vehicle configuration</CardTitle>
              </div>
              <button type="button" className="button-secondary inline-flex items-center gap-1.5 text-sm">
                <Pencil size={13} />
                Edit config
              </button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="maint-config-card">
                  <p className="maint-config-label">Service interval</p>
                  <p className="maint-config-value">
                    {mockServiceConfig.serviceIntervalKm.toLocaleString()} km / {mockServiceConfig.serviceIntervalDays} days
                  </p>
                </div>
                <div className="maint-config-card">
                  <p className="maint-config-label">Alert before service</p>
                  <p className="maint-config-value">
                    {mockServiceConfig.alertBeforeKm} km / {mockServiceConfig.alertBeforeDays} days
                  </p>
                </div>
                <div className="maint-config-card">
                  <p className="maint-config-label">Current mileage</p>
                  <p className="maint-config-value">{mockCar.currentMileage.toLocaleString()} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardDescription className="island-kicker">Maintenance Events</CardDescription>
                <CardTitle>
                  <span className="text-amber-600">1 open event</span>
                </CardTitle>
              </div>
              <button type="button" className="button-secondary inline-flex items-center gap-1.5 text-sm">
                Log event
              </button>
            </CardHeader>
            <CardContent>
              <div className="maint-event-table">
                <div className="maint-event-table-header">
                  <span>Date</span>
                  <span>Type</span>
                  <span>Description</span>
                  <span>Mileage</span>
                  <span>Cost</span>
                  <span>Status</span>
                </div>
                {mockMaintenanceEvents.map((ev) => (
                  <div key={ev.id} className="maint-event-row">
                    <span className="text-xs tabular-nums">{ev.date}</span>
                    <span className="maint-type-badge">{ev.type}</span>
                    <span className="text-sm">{ev.description}</span>
                    <span className="text-xs tabular-nums text-[var(--sea-ink-soft)]">{ev.mileage}</span>
                    <span className="text-xs tabular-nums">{ev.cost}</span>
                    <span className={`maint-status-badge maint-status-badge--${ev.status.toLowerCase()}`}>
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardDescription className="island-kicker">Documents & renewals</CardDescription>
              <CardTitle className="sr-only">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {mockDocuments.map((doc) => (
                  <div key={doc.label} className="maint-config-card">
                    <p className="maint-config-label">{doc.label}</p>
                    <p className="maint-config-value">Expires {doc.expiry}</p>
                    <p className="maint-config-ref">{doc.ref}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardDescription className="island-kicker">Rental history</CardDescription>
              <CardTitle className="sr-only">Rental history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="maint-event-table">
                <div className="maint-event-table-header">
                  <span>Customer</span>
                  <span>Dates</span>
                  <span>Total</span>
                  <span>Status</span>
                </div>
                {mockRentalHistory.map((r) => (
                  <div key={r.id} className="maint-event-row">
                    <span className="text-sm">{r.customer}</span>
                    <span className="text-xs text-[var(--sea-ink-soft)]">{r.dates}</span>
                    <span className="text-xs tabular-nums">{r.total}</span>
                    <span className="maint-status-badge maint-status-badge--completed">{r.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating variant switcher — prototype only */}
      <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] p-1 shadow-lg">
        {VARIANT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => navigate({ search: { variant: opt.value } })}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              variant === opt.value
                ? 'bg-[var(--ember)] text-white'
                : 'text-[var(--sea-ink-soft)] hover:bg-[rgba(26,25,22,0.06)]',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </AdminSidebarShell>
  )
}
