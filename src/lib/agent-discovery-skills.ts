import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { publicSitePath } from '#/lib/brand'

const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'

type AgentSkillEntry = {
  name: string
  type: 'skill-md'
  description: string
  url: string
  digest: string
}

/** Node-only skill index builder — keep out of browser entrypoints. */
export function sha256Digest(content: string): string {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

export function buildAgentSkillsIndex(siteUrl?: string): {
  $schema: string
  skills: AgentSkillEntry[]
} {
  const skillsDir = join(process.cwd(), 'public/.well-known/agent-skills')
  const skillFiles = [
    {
      name: 'book-langkawi-car',
      file: 'book-langkawi-car.md',
      description: 'Book a car rental in Langkawi via XQCar — dates, fleet, pickup, and checkout.',
    },
    {
      name: 'langkawi-driving-guides',
      file: 'langkawi-driving-guides.md',
      description: 'Langkawi driving guides — pickup, routes, parking, fuel, and island know-how.',
    },
  ]

  const skills: AgentSkillEntry[] = skillFiles.map(({ name, file, description }) => {
    const filePath = join(skillsDir, file)
    const content = readFileSync(filePath, 'utf8')
    return {
      name,
      type: 'skill-md',
      description,
      url: publicSitePath(`/.well-known/agent-skills/${file}`, siteUrl),
      digest: sha256Digest(content),
    }
  })

  return {
    $schema: AGENT_SKILLS_SCHEMA,
    skills,
  }
}
