"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

import { Tabs } from "@/components/ui/tabs"

export type PassportCollection = "companies" | "tags" | "missions"

export function PassportTabs({
  initialValue,
  children,
}: Readonly<{
  initialValue: PassportCollection
  children: ReactNode
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedCollection = searchParams.get("collection")
  const value: PassportCollection =
    requestedCollection === "tags" || requestedCollection === "missions"
      ? requestedCollection
      : initialValue

  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("collection", nextValue)
        router.replace(`${pathname}?${params}#passport-collections`, {
          scroll: false,
        })
      }}
    >
      {children}
    </Tabs>
  )
}
