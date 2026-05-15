import { createFileRoute } from '@tanstack/react-router'

import { PickupReturnGuide } from '#/components/guides/pickup-return-guide'

export const Route = createFileRoute('/guides/pickup-return')({
  component: GuidesPickupReturnPage,
})

function GuidesPickupReturnPage() {
  return <PickupReturnGuide />
}
