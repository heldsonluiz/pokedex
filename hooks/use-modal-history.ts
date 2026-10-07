"use client"

import { useEffect, useId, useRef } from "react"

import { createModalHistory } from "@/lib/modal-history"

let modalHistory: ReturnType<typeof createModalHistory> | undefined

export function useModalHistory(
  open: boolean,
  close: () => void,
  enabled = true
) {
  const id = useId()
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  }, [close])
  useEffect(() => {
    if (!open || !enabled) return
    modalHistory ??= createModalHistory(window)
    return modalHistory.register(id, () => closeRef.current())
  }, [open, enabled, id])
}
