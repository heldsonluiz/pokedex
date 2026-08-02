import type { AccessRole } from "./profile.schema"
import type { Profile } from "./profile.types"

export type AppPermission =
  | "participate"
  | "review-missions"
  | "edit-content"
  | "access-staff"
  | "serve-participants"
  | "view-raffle-display"
  | "manage-event-operations"

const PERMISSIONS_BY_ROLE: Record<AccessRole, readonly AppPermission[]> = {
  participant: ["participate"],
  staff: ["access-staff"],
  reviewer: [
    "access-staff",
    "review-missions",
    "serve-participants",
    "view-raffle-display",
  ],
  editor: ["access-staff", "edit-content"],
  admin: [
    "access-staff",
    "review-missions",
    "edit-content",
    "serve-participants",
    "view-raffle-display",
    "manage-event-operations",
  ],
}

export function hasAccessRole(
  profile: Pick<Profile, "accessRoles">,
  role: AccessRole
) {
  return profile.accessRoles.includes(role)
}

export function hasPermission(
  profile: Pick<Profile, "accessRoles">,
  permission: AppPermission
) {
  return profile.accessRoles.some((role) =>
    PERMISSIONS_BY_ROLE[role].includes(permission)
  )
}
