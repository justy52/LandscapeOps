# Clerk Organization Sync Plan

**Status:** Required for Phase 1  
**Owner:** Claude (architecture/backend lead)

---

## Purpose

LandscapeOps uses Clerk as the identity and organization source of truth. Clerk organizations map to the `Organization` model; Clerk memberships map to `UserProfile` records. These must be kept in sync so the Prisma layer has authoritative tenant and user data.

The sync is one-directional: Clerk → Prisma. Clerk is authoritative. Prisma records are derived.

---

## Sync Architecture

Clerk fires webhook events to `/api/webhooks/clerk` when organizations and memberships change. The handler processes each event, updates Prisma, and writes an audit log entry. This is the only supported sync mechanism. There is no polling, no scheduled sync, and no manual sync endpoint.

### Signature verification

Every webhook request must pass Svix signature verification before any payload is processed.

Install: `npm install svix`

```typescript
import { Webhook } from 'svix';

const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
const payload = wh.verify(rawBody, {
  'svix-id': headers['svix-id'],
  'svix-timestamp': headers['svix-timestamp'],
  'svix-signature': headers['svix-signature'],
});
```

Requests that fail verification must return `400` with no payload processing. Stale requests (Svix enforces a 5-minute timestamp window by default) must be rejected.

The raw request body must be read as a string before verification — do not parse JSON first.

---

## Webhook Events

### `organization.created`

**When:** A new Clerk organization is created.

**Action:** Upsert `Organization` in Prisma.

```typescript
await prisma.organization.upsert({
  where: { clerkOrgId: event.data.id },
  create: {
    clerkOrgId: event.data.id,
    name: event.data.name,
    slug: event.data.slug,
  },
  update: {
    name: event.data.name,
    slug: event.data.slug,
  },
});
```

Use `upsert` rather than `create` to handle re-delivery of the same event (Clerk guarantees at-least-once delivery).

**Audit log:** Write `org.synced` entry with `orgId`, `action: 'org.created'`, `metadata: { clerkOrgId }`.

---

### `organization.updated`

**When:** Organization name, slug, or metadata changes in Clerk.

**Action:** Update `Organization.name` and `Organization.slug` in Prisma.

```typescript
await prisma.organization.update({
  where: { clerkOrgId: event.data.id },
  data: {
    name: event.data.name,
    slug: event.data.slug,
  },
});
```

If the record does not exist (sync gap), treat it as `organization.created` and upsert.

**Audit log:** Write `org.updated` entry.

---

### `organization.deleted`

**When:** A Clerk organization is deleted.

**Action:** Do NOT auto-cascade delete the Prisma `Organization`. This would destroy all tenant data (customers, jobs, invoices) via Prisma cascade rules.

Instead:

1. Log the event with full `clerkOrgId` in the audit log.
2. Optionally mark the `Organization` as suspended with a `suspendedAt` timestamp if the field exists. Phase 1 should add `suspendedAt DateTime?` to `Organization` for this purpose.
3. Require a manual admin action to confirm and execute hard-delete.

**Audit log:** Write `org.deletion_requested` entry with `clerkOrgId` and timestamp.

**TODO for Phase 1 schema:** Add `suspendedAt DateTime?` to `Organization`.

---

### `organizationMembership.created`

**When:** A user joins a Clerk organization.

**Action:** Upsert `UserProfile` in Prisma.

```typescript
const org = await prisma.organization.findUnique({
  where: { clerkOrgId: event.data.organization.id },
  select: { id: true },
});
if (!org) {
  // Org not yet synced — handle race condition
  // Option: queue retry, or process org.created first
  return new Response('Org not found, retry later', { status: 503 });
}

await prisma.userProfile.upsert({
  where: {
    orgId_clerkUserId: { orgId: org.id, clerkUserId: event.data.public_user_data.user_id },
  },
  create: {
    orgId: org.id,
    clerkUserId: event.data.public_user_data.user_id,
    email: event.data.public_user_data.identifier,
    name: [
      event.data.public_user_data.first_name,
      event.data.public_user_data.last_name,
    ].filter(Boolean).join(' ') || null,
    role: mapClerkRole(event.data.role),
  },
  update: {
    email: event.data.public_user_data.identifier,
    name: [
      event.data.public_user_data.first_name,
      event.data.public_user_data.last_name,
    ].filter(Boolean).join(' ') || null,
    role: mapClerkRole(event.data.role),
  },
});
```

**Audit log:** Write `user.profile.created` or `user.profile.updated` entry.

---

### `organizationMembership.updated`

**When:** A member's Clerk role changes.

**Action:** Update `UserProfile.role` in Prisma.

```typescript
await prisma.userProfile.update({
  where: {
    orgId_clerkUserId: { orgId: org.id, clerkUserId: event.data.public_user_data.user_id },
  },
  data: {
    role: mapClerkRole(event.data.role),
  },
});
```

**Audit log:** Write `user.profile.role_updated` entry with `metadata: { previousRole, newRole }`.

---

### `organizationMembership.deleted`

**When:** A member is removed from a Clerk organization.

**Action:** Delete the `UserProfile` record for that org.

```typescript
await prisma.userProfile.delete({
  where: {
    orgId_clerkUserId: { orgId: org.id, clerkUserId: event.data.public_user_data.user_id },
  },
});
```

Note: If the `UserProfile` has `AuditLog` entries (as `actor`), deletion will set `AuditLog.actorId` to `null` via the `onDelete: SetNull` rule in the schema. This is correct behavior — audit logs are preserved.

If the `UserProfile` is the sole `OWNER` of an org, do not delete without a warning check. Log the event and surface it as a configuration error if no other OWNER exists.

**Audit log:** Write `user.profile.removed` entry.

---

## Role Mapping

Clerk org roles are configurable strings. The default Clerk roles are `org:admin` and `org:member`. Map them to app roles:

```typescript
function mapClerkRole(clerkRole: string): UserRole {
  switch (clerkRole) {
    case 'org:admin': return 'ADMIN';
    case 'org:member': return 'MEMBER';
    default:
      console.warn(`Unknown Clerk role: ${clerkRole}, defaulting to MEMBER`);
      return 'MEMBER';
  }
}
```

**OWNER role:** `OWNER` is not a Clerk role. It is an app-layer designation granted manually — typically to the first member who creates the org, or assigned by an existing OWNER. The sync handler should auto-assign `OWNER` to the first `organizationMembership.created` event for a newly created org (i.e., when no `UserProfile` records exist for that org yet).

```typescript
const existingMembers = await prisma.userProfile.count({ where: { orgId: org.id } });
const role = existingMembers === 0 ? 'OWNER' : mapClerkRole(event.data.role);
```

**FIELD role:** Not a Clerk role. Assign after the org is set up via the LandscapeOps settings UI (Phase 2+). Field users are initially synced as `MEMBER` and promoted by an ADMIN or OWNER.

**MANAGER role:** Same as FIELD — not a Clerk role. Promote via the settings UI.

---

## Race Conditions and Error Handling

Clerk delivers webhooks asynchronously and guarantees at-least-once delivery but not strict ordering. Handle these cases:

| Scenario | Handling |
|---|---|
| `organizationMembership.created` arrives before `organization.created` | Return `503`, Clerk will retry. Log the gap. |
| Duplicate event delivery | Use `upsert` — idempotent by design. |
| Partial database write failure | Do not return `200` if the Prisma write failed. Return `500` so Clerk retries. |
| `organization.deleted` before `organizationMembership.deleted` | Cascade delete handles member profiles. Write `org.deletion_requested` before cascading. |

Webhook handler must return:

- `200` only when Prisma write and audit log write succeed.
- `400` for invalid signature or malformed payload.
- `503` for retry-able gaps (org not yet created, temporary DB failure).
- Never return `500` without logging the error to Sentry.

---

## Webhook Registration in Clerk

Configure in the Clerk dashboard:

| Setting | Value |
|---|---|
| Endpoint URL | `https://<your-domain>/api/webhooks/clerk` |
| Events | `organization.created`, `organization.updated`, `organization.deleted`, `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted` |
| Signing secret | Copy to `CLERK_WEBHOOK_SECRET` in Vercel environment variables |

For local development: use `ngrok http 3000` to expose the local server and register the ngrok URL as a development endpoint in Clerk.

Do not register `user.created` or `user.updated` events — LandscapeOps tracks users per-org via `organizationMembership` events, not globally.

---

## Testing the Sync

Minimum tests for the webhook handler:

1. Valid `organization.created` payload with correct signature → `Organization` created in Prisma, audit log written.
2. Valid `organizationMembership.created` payload → `UserProfile` created with correct role mapping.
3. Invalid Svix signature → returns `400`, no Prisma write.
4. Duplicate `organization.created` for same `clerkOrgId` → `Organization` updated, no duplicate.
5. `organizationMembership.created` where `clerkOrgId` not in Prisma → returns `503`, no Prisma write.

---

## References

- `docs/02-architecture/tenant-isolation-rules.md` — orgId resolution rules
- `docs/06-build/phase-1-auth-tenant-core-plan.md` — full Phase 1 plan
- `docs/02-architecture/permission-matrix.md` — role definitions
