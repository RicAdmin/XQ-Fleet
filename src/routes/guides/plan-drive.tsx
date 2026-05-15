import { createFileRoute } from '@tanstack/react-router'

import { PlanDriveGuide } from '#/components/guides/plan-drive-guide'

export const Route = createFileRoute('/guides/plan-drive')({
  component: GuidesPlanDrivePage,
})

function GuidesPlanDrivePage() {
  return <PlanDriveGuide />
}
