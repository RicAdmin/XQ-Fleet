import path from 'path'

import { createElement } from 'react'

import { renderToBuffer } from '@react-pdf/renderer'
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import type { DocumentData } from '#/lib/document-components'
import { InvoiceDocument } from '#/lib/document-components'

export const Route = createFileRoute('/api/documents/invoice/$rentalId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { auth } = await import('#/lib/auth')
        const { isAppRole } = await import('#/lib/auth-model')

        const session = await auth.api.getSession({ headers: request.headers })

        if (!session) {
          return new Response('Unauthorized', { status: 401 })
        }

        const sessionUser = session.user as { role?: string }
        if (!isAppRole(sessionUser.role)) {
          return new Response('Unauthorized', { status: 401 })
        }

        if (!['owner', 'staff'].includes(sessionUser.role)) {
          return new Response('Forbidden', { status: 403 })
        }

        const { db } = await import('#/db')
        const { rentals, cars, customers } = await import('#/db/schema')

        const row = await db
          .select({
            id: rentals.id,
            type: rentals.type,
            status: rentals.status,
            paymentStatus: rentals.paymentStatus,
            startDate: rentals.startDate,
            endDate: rentals.endDate,
            actualReturnDate: rentals.actualReturnDate,
            dailyRateSen: rentals.dailyRateSen,
            totalAmountSen: rentals.totalAmountSen,
            depositAmountSen: rentals.depositAmountSen,
            paidAmountSen: rentals.paidAmountSen,
            carPlateNumber: cars.plateNumber,
            carMake: cars.make,
            carModel: cars.model,
            carYear: cars.year,
            carCategory: cars.category,
            customerFullName: customers.fullName,
            customerIcOrPassport: customers.icOrPassport,
            customerPhone: customers.phone,
            customerAddress: customers.address,
          })
          .from(rentals)
          .innerJoin(cars, eq(rentals.carId, cars.id))
          .innerJoin(customers, eq(rentals.customerId, customers.id))
          .where(eq(rentals.id, params.rentalId))
          .limit(1)
          .then((r) => r[0] ?? null)

        if (!row) {
          return new Response('Rental not found', { status: 404 })
        }

        if (row.status !== 'closed') {
          return new Response('Invoice only available for closed rentals', { status: 400 })
        }

        const logoPath = path.join(process.cwd(), 'public', 'image', 'xqCarLogo.png')

        const docData: DocumentData = {
          rentalId: row.id,
          type: row.type,
          status: row.status,
          paymentStatus: row.paymentStatus,
          startDate: row.startDate,
          endDate: row.endDate,
          actualReturnDate: row.actualReturnDate,
          dailyRateSen: row.dailyRateSen,
          totalAmountSen: row.totalAmountSen,
          depositAmountSen: row.depositAmountSen,
          paidAmountSen: row.paidAmountSen,
          carPlateNumber: row.carPlateNumber,
          carMake: row.carMake,
          carModel: row.carModel,
          carYear: row.carYear,
          carCategory: row.carCategory,
          customerFullName: row.customerFullName,
          customerIcOrPassport: row.customerIcOrPassport,
          customerPhone: row.customerPhone,
          customerAddress: row.customerAddress,
          logoPath,
          generatedAt: new Date(),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = createElement(InvoiceDocument, { data: docData }) as any
        const buffer = await renderToBuffer(element)

        const isDownload = new URL(request.url).searchParams.get('download') === '1'
        const filename = `invoice-${row.carPlateNumber ?? params.rentalId}.pdf`

        return new Response(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': isDownload
              ? `attachment; filename="${filename}"`
              : `inline; filename="${filename}"`,
          },
        })
      },
    },
  },
})
