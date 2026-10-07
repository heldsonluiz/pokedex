const STATE_KEY = "pokedexModalStack"

type HistoryHost = Pick<Window, "history" | "location" | "addEventListener">
type Entry = { close: () => void; url: string; active: boolean }

/** Adds same-URL entries while preserving the router's history state. */
export function createModalHistory(host: HistoryHost) {
  const entries = new Map<string, Entry>()
  let pendingBack = false
  const queued = new Set<string>()

  function stack(): string[] {
    const value = host.history.state?.[STATE_KEY]
    return Array.isArray(value) ? value : []
  }

  function push(id: string) {
    const entry = entries.get(id)
    if (!entry?.active || entry.url !== host.location.href) return
    host.history.pushState(
      { ...host.history.state, [STATE_KEY]: [...stack(), id] },
      "",
      host.location.href
    )
  }

  function removeClosedTop() {
    const ids = stack()
    const id = ids.at(-1)
    const entry = id ? entries.get(id) : undefined
    if (
      entry &&
      !entry.active &&
      entry.url === host.location.href &&
      !pendingBack
    ) {
      pendingBack = true
      host.history.back()
    }
  }

  host.addEventListener("popstate", () => {
    pendingBack = false
    const ids = stack()
    for (const [id, entry] of [...entries].reverse()) {
      if (
        entry.active &&
        ((!ids.includes(id) && !queued.has(id)) ||
          entry.url !== host.location.href)
      ) {
        entry.active = false
        entry.close()
      }
    }
    removeClosedTop()
    if (!pendingBack) {
      for (const id of queued) push(id)
      queued.clear()
    }
  })

  return {
    register(id: string, close: () => void) {
      const entry: Entry = {
        close,
        url: host.location.href,
        active: true,
      }
      entries.set(id, entry)
      if (!stack().includes(id)) {
        if (pendingBack) queued.add(id)
        else push(id)
      }
      return () => {
        // React Strict Mode may immediately register the same instance again.
        queueMicrotask(() => {
          if (entries.get(id) !== entry) return
          entry.active = false
          queued.delete(id)
          removeClosedTop()
        })
      }
    },
  }
}
