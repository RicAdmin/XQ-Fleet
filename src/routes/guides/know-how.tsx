import { createFileRoute } from '@tanstack/react-router'

import { KnowHowGuide } from '#/components/guides/know-how-guide'

export const Route = createFileRoute('/guides/know-how')({
  component: GuidesKnowHowPage,
})

function GuidesKnowHowPage() {
  return <KnowHowGuide />
}
