"use server"

import * as z from "zod"

import { signIn, signOut } from "@/lib/auth"
import { getSafeCallbackPath } from "@/lib/get-safe-callback-path"

const callbackUrlSchema = z.string().max(2048).optional()

export async function signInWithGoogle(formData: FormData) {
  const callbackUrlResult = callbackUrlSchema.safeParse(
    formData.get("callbackUrl") ?? undefined
  )

  const callbackUrl = callbackUrlResult.success
    ? callbackUrlResult.data
    : undefined

  const redirectTo = getSafeCallbackPath(callbackUrl)

  await signIn("google", {
    redirectTo,
  })
}

export async function signOutCurrentUser() {
  await signOut({
    redirectTo: "/login",
  })
}
