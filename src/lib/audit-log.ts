import type { AuditAction } from '#/db/schema/audit'
import type { AppRole } from '#/lib/auth-model'

type RecordAuditLogInput = {
  actorUserId?: string | null
  actorRole?: AppRole | null
  action: AuditAction
  entityType: string
  entityId: string
  before?: unknown
  after?: unknown
}

type DbLike = Pick<Awaited<typeof import('#/db')>['db'], 'insert'>

/**
 * Insert an audit_log row. Reads request IP / UA from `getRequestHeaders()` when
 * available (server-only). Pass `tx` to participate in an enclosing transaction.
 *
 * Failures are surfaced — callers should generally already be inside a
 * transaction or accept that the action + audit are inseparable.
 */
export async function recordAuditLog(
  input: RecordAuditLogInput,
  tx?: DbLike,
): Promise<void> {
  const { auditLog } = await import('#/db/schema/audit')

  let ipAddress: string | null = null
  let userAgent: string | null = null

  try {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const headerMap = new Headers(headers as HeadersInit)
    ipAddress =
      headerMap.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headerMap.get('x-real-ip') ??
      null
    userAgent = headerMap.get('user-agent') ?? null
  } catch {
    // Outside an HTTP request — leave IP/UA null.
  }

  const dbClient: DbLike =
    tx ?? (await import('#/db').then((m) => m.db))

  await dbClient.insert(auditLog).values({
    actorUserId: input.actorUserId ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: (input.before ?? null) as object | null,
    after: (input.after ?? null) as object | null,
    ipAddress,
    userAgent,
  })
}
