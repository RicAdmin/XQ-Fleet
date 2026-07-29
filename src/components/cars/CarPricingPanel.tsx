import { useState } from 'react'

import { showAdminToast } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { updateCarPricing } from '#/lib/car-functions'

export type CarPricingFields = {
  id: string
  dailyRateSen: number
  priceLowSeasonSen: number
  pricePeakSeasonSen: number
  priceSuperPeakSeasonSen: number
  extHourLowSen: number
  extHourPeakAndSuperPeakSen: number
  deliveryFeeAirportSen: number
  deliveryFeeJettySen: number
  deliveryFeeHotelSen: number
  lateReturnHourlyFeeSen: number
  promotionalPriceSen: number | null
  minRentalDays: number
  maxRentalDays: number
}

type Props = {
  car: CarPricingFields
  canEdit: boolean
  onSaved: (car: CarPricingFields) => void
}

type MoneyField = {
  key:
    | 'dailyRateRM'
    | 'priceLowSeasonRM'
    | 'pricePeakSeasonRM'
    | 'priceSuperPeakSeasonRM'
    | 'extHourLowRM'
    | 'extHourPeakRM'
    | 'deliveryAirportRM'
    | 'deliveryJettyRM'
    | 'deliveryHotelRM'
    | 'lateReturnRM'
    | 'promotionalRM'
  label: string
  id: string
}

function toRM(sen: number) {
  return (sen / 100).toFixed(2)
}

function parseRM(value: string): number {
  return Math.round(Number(value || '0') * 100)
}

function PricingSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="catalog-form__section">
      <header className="catalog-form__section-head">
        <h3 className="catalog-form__section-title">{title}</h3>
        {description ? <p className="catalog-form__section-desc">{description}</p> : null}
      </header>
      {children}
    </section>
  )
}

function MoneyInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: MoneyField
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="field-label" htmlFor={field.id}>
        {field.label}
      </label>
      <input
        id={field.id}
        type="number"
        min={0}
        step={0.01}
        className="field-input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function CarPricingPanel({ car, canEdit, onSaved }: Props) {
  const [form, setForm] = useState({
    dailyRateRM: toRM(car.dailyRateSen),
    priceLowSeasonRM: toRM(car.priceLowSeasonSen),
    pricePeakSeasonRM: toRM(car.pricePeakSeasonSen),
    priceSuperPeakSeasonRM: toRM(car.priceSuperPeakSeasonSen),
    extHourLowRM: toRM(car.extHourLowSen),
    extHourPeakRM: toRM(car.extHourPeakAndSuperPeakSen),
    deliveryAirportRM: toRM(car.deliveryFeeAirportSen),
    deliveryJettyRM: toRM(car.deliveryFeeJettySen),
    deliveryHotelRM: toRM(car.deliveryFeeHotelSen),
    lateReturnRM: toRM(car.lateReturnHourlyFeeSen),
    promotionalRM:
      car.promotionalPriceSen != null ? toRM(car.promotionalPriceSen) : '',
    minRentalDays: String(car.minRentalDays),
    maxRentalDays: String(car.maxRentalDays),
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!canEdit) return
    setError(null)
    setSaving(true)
    try {
      const promoTrimmed = form.promotionalRM.trim()
      const updated = await updateCarPricing({
        data: {
          carId: car.id,
          dailyRateSen: parseRM(form.dailyRateRM),
          priceLowSeasonSen: parseRM(form.priceLowSeasonRM),
          pricePeakSeasonSen: parseRM(form.pricePeakSeasonRM),
          priceSuperPeakSeasonSen: parseRM(form.priceSuperPeakSeasonRM),
          extHourLowSen: parseRM(form.extHourLowRM),
          extHourPeakAndSuperPeakSen: parseRM(form.extHourPeakRM),
          deliveryFeeAirportSen: parseRM(form.deliveryAirportRM),
          deliveryFeeJettySen: parseRM(form.deliveryJettyRM),
          deliveryFeeHotelSen: parseRM(form.deliveryHotelRM),
          lateReturnHourlyFeeSen: parseRM(form.lateReturnRM),
          promotionalPriceSen: promoTrimmed ? parseRM(promoTrimmed) : null,
          minRentalDays: Number(form.minRentalDays) || 1,
          maxRentalDays: Number(form.maxRentalDays) || 30,
        },
      })
      onSaved({
        id: updated.id,
        dailyRateSen: updated.dailyRateSen,
        priceLowSeasonSen: updated.priceLowSeasonSen,
        pricePeakSeasonSen: updated.pricePeakSeasonSen,
        priceSuperPeakSeasonSen: updated.priceSuperPeakSeasonSen,
        extHourLowSen: updated.extHourLowSen,
        extHourPeakAndSuperPeakSen: updated.extHourPeakAndSuperPeakSen,
        deliveryFeeAirportSen: updated.deliveryFeeAirportSen,
        deliveryFeeJettySen: updated.deliveryFeeJettySen,
        deliveryFeeHotelSen: updated.deliveryFeeHotelSen,
        lateReturnHourlyFeeSen: updated.lateReturnHourlyFeeSen,
        promotionalPriceSen: updated.promotionalPriceSen,
        minRentalDays: updated.minRentalDays,
        maxRentalDays: updated.maxRentalDays,
      })
      showAdminToast('Pricing saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save.')
    } finally {
      setSaving(false)
    }
  }

  const seasonRates: MoneyField[] = [
    { key: 'dailyRateRM', label: 'Daily rate (RM)', id: 'cp-daily' },
    { key: 'priceLowSeasonRM', label: 'Low season (RM)', id: 'cp-low' },
    { key: 'pricePeakSeasonRM', label: 'Peak season (RM)', id: 'cp-peak' },
    { key: 'priceSuperPeakSeasonRM', label: 'Super peak (RM)', id: 'cp-super' },
    { key: 'promotionalRM', label: 'Promo price (RM, optional)', id: 'cp-promo' },
  ]

  const extensionFees: MoneyField[] = [
    { key: 'extHourLowRM', label: 'Ext. hour low (RM)', id: 'cp-ext-low' },
    { key: 'extHourPeakRM', label: 'Ext. hour peak (RM)', id: 'cp-ext-peak' },
    { key: 'lateReturnRM', label: 'Late return / hour (RM)', id: 'cp-late' },
  ]

  const deliveryFees: MoneyField[] = [
    { key: 'deliveryAirportRM', label: 'Airport delivery (RM)', id: 'cp-air' },
    { key: 'deliveryJettyRM', label: 'Jetty delivery (RM)', id: 'cp-jetty' },
    { key: 'deliveryHotelRM', label: 'Hotel delivery (RM)', id: 'cp-hotel' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardDescription className="island-kicker">Commercial</CardDescription>
        <CardTitle className="text-base">Pricing & fees</CardTitle>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Season rates, delivery fees, overtime charges, and rental day limits for this model.
        </p>
      </CardHeader>
      <CardContent>
        <form className="catalog-form" onSubmit={handleSave}>
          <PricingSection
            title="Season rates"
            description="Base daily price and seasonal overrides used in booking quotes."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {seasonRates.map((field) => (
                <MoneyInput
                  key={field.id}
                  field={field}
                  value={form[field.key]}
                  disabled={!canEdit}
                  onChange={(value) => setField(field.key, value)}
                />
              ))}
            </div>
          </PricingSection>

          <PricingSection
            title="Extension & late fees"
            description="Hourly charges when a rental runs past the booked return time."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {extensionFees.map((field) => (
                <MoneyInput
                  key={field.id}
                  field={field}
                  value={form[field.key]}
                  disabled={!canEdit}
                  onChange={(value) => setField(field.key, value)}
                />
              ))}
            </div>
          </PricingSection>

          <PricingSection
            title="Delivery fees"
            description="One-way delivery charges by meet point type."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deliveryFees.map((field) => (
                <MoneyInput
                  key={field.id}
                  field={field}
                  value={form[field.key]}
                  disabled={!canEdit}
                  onChange={(value) => setField(field.key, value)}
                />
              ))}
            </div>
          </PricingSection>

          <PricingSection
            title="Rental limits"
            description="Minimum and maximum stay allowed for online bookings."
          >
            <div className="grid max-w-md gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="cp-min-days">
                  Min rental days
                </label>
                <input
                  id="cp-min-days"
                  type="number"
                  min={1}
                  className="field-input"
                  value={form.minRentalDays}
                  disabled={!canEdit}
                  onChange={(e) => setField('minRentalDays', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cp-max-days">
                  Max rental days
                </label>
                <input
                  id="cp-max-days"
                  type="number"
                  min={1}
                  className="field-input"
                  value={form.maxRentalDays}
                  disabled={!canEdit}
                  onChange={(e) => setField('maxRentalDays', e.target.value)}
                />
              </div>
            </div>
          </PricingSection>

          {canEdit ? (
            <div className="catalog-form__footer">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save pricing'}
              </Button>
              <div>{error ? <p className="form-error">{error}</p> : null}</div>
            </div>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
