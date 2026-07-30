"use server"

import { revalidateTag } from "next/cache"

import { CACHE_TAGS } from "@/config/cache"
import { requireAuth } from "@/lib/require-auth"
import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"

export type CatalogCacheActionState = Readonly<{
  success: boolean
  message?: string
}>

export async function invalidateCatalogCacheAction(
  _previousState: CatalogCacheActionState
): Promise<CatalogCacheActionState> {
  const session = await requireAuth()
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "manage-event-operations")) {
    return {
      success: false,
      message: "Esta conta não pode atualizar os catálogos.",
    }
  }

  Object.values(CACHE_TAGS).forEach((tag) => revalidateTag(tag, { expire: 0 }))

  return {
    success: true,
    message:
      "Cache atualizado. A próxima consulta buscará os dados do Firestore.",
  }
}
