import { describe, expect, it, vi } from "vitest"

import { createModalHistory } from "./modal-history"

function browser() {
  const states: { state: Record<string, unknown>; url: string }[] = [
    { state: { __NA: true, tree: "home" }, url: "https://example.test/home" },
    {
      state: { __NA: true, tree: "missions" },
      url: "https://example.test/missions",
    },
  ]
  let index = 1
  const listeners: (() => void)[] = []
  const location = {
    get href() {
      return states[index].url
    },
  }
  const history = {
    get state() {
      return states[index].state
    },
    pushState(state: Record<string, unknown>, _: string, url: string) {
      states.splice(index + 1)
      states.push({ state, url })
      index++
    },
    back: vi.fn(() => {
      queueMicrotask(() => {
        if (index > 0) index--
        listeners.forEach((listener) => listener())
      })
    }),
  }
  const host = {
    history,
    location,
    addEventListener(_: string, listener: () => void) {
      listeners.push(listener)
    },
  }
  return {
    history,
    location,
    controller: createModalHistory(host as unknown as Window),
  }
}

async function settle() {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}

describe("modal browser history", () => {
  it("closes the modal on Back and only navigates on the next Back", async () => {
    const { history, location, controller } = browser()
    const close = vi.fn()
    controller.register("mission", close)
    history.back()
    await settle()
    expect(close).toHaveBeenCalledOnce()
    expect(location.href).toBe("https://example.test/missions")
    history.back()
    await settle()
    expect(location.href).toBe("https://example.test/home")
  })

  it("preserves Next.js router state", () => {
    const { history, controller } = browser()
    controller.register("mission", vi.fn())
    expect(history.state).toMatchObject({ __NA: true, tree: "missions" })
  })

  it("consumes the entry when closed by X, Escape or backdrop", async () => {
    const { history, location, controller } = browser()
    const close = vi.fn()
    const release = controller.register("mission", close)
    release()
    await settle()
    expect(location.href).toBe("https://example.test/missions")
    expect(close).not.toHaveBeenCalled()
    history.back()
    await settle()
    expect(location.href).toBe("https://example.test/home")
  })

  it("closes only the top modal when nested", async () => {
    const { history, location, controller } = browser()
    const outer = vi.fn()
    const inner = vi.fn()
    controller.register("outer", outer)
    controller.register("inner", inner)
    history.back()
    await settle()
    expect(inner).toHaveBeenCalledOnce()
    expect(outer).not.toHaveBeenCalled()
    history.back()
    await settle()
    expect(outer).toHaveBeenCalledOnce()
    expect(location.href).toBe("https://example.test/missions")
  })

  it("does not create duplicate entries during Strict Mode cleanup", async () => {
    const { history, controller } = browser()
    const release = controller.register("mission", vi.fn())
    release()
    const close = vi.fn()
    controller.register("mission", close)
    await settle()
    expect(history.back).not.toHaveBeenCalled()
    history.back()
    await settle()
    expect(close).toHaveBeenCalledOnce()
  })

  it("does not undo navigation to a different page during unmount", async () => {
    const { history, location, controller } = browser()
    const release = controller.register("mission", vi.fn())
    history.pushState(
      { __NA: true, tree: "scanner" },
      "",
      "https://example.test/scan"
    )
    release()
    await settle()
    expect(history.back).not.toHaveBeenCalled()
    expect(location.href).toBe("https://example.test/scan")
  })

  it("supports opening another modal while manual closing finishes", async () => {
    const { history, location, controller } = browser()
    const release = controller.register("first", vi.fn())
    release()
    await Promise.resolve()
    const close = vi.fn()
    controller.register("second", close)
    await settle()
    expect(close).not.toHaveBeenCalled()
    history.back()
    await settle()
    expect(close).toHaveBeenCalledOnce()
    expect(location.href).toBe("https://example.test/missions")
  })

  it("skips a closed parent when its nested modal is dismissed", async () => {
    const { history, location, controller } = browser()
    const release = controller.register("outer", vi.fn())
    const inner = vi.fn()
    controller.register("inner", inner)
    release()
    await settle()
    expect(history.back).not.toHaveBeenCalled()
    history.back()
    await settle()
    expect(inner).toHaveBeenCalledOnce()
    expect(location.href).toBe("https://example.test/missions")
  })
})
