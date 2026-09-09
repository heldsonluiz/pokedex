import { afterEach, describe, expect, it, vi } from "vitest"

import { awaitScannerRequest } from "./scanner-request"

afterEach(() => vi.useRealTimers())

describe("scanner request", () => {
  it("returns the server result and clears the timeout", async () => {
    vi.useFakeTimers()
    await expect(
      awaitScannerRequest(Promise.resolve("ALREADY_CONNECTED"))
    ).resolves.toBe("ALREADY_CONNECTED")
    expect(vi.getTimerCount()).toBe(0)
  })

  it("propagates transport failures and clears the timeout", async () => {
    vi.useFakeTimers()
    await expect(
      awaitScannerRequest(Promise.reject(new Error("offline")))
    ).rejects.toThrow("offline")
    expect(vi.getTimerCount()).toBe(0)
  })

  it("ends a stalled request and ignores a late server response", async () => {
    vi.useFakeTimers()
    let resolveRequest!: (value: string) => void
    const request = awaitScannerRequest(
      new Promise<string>((resolve) => {
        resolveRequest = resolve
      })
    )
    const assertion = expect(request).rejects.toThrow("timed out")
    await vi.advanceTimersByTimeAsync(15_000)
    await assertion
    resolveRequest("CONNECTION_CREATED")
    await expect(request).rejects.toThrow("timed out")
    expect(vi.getTimerCount()).toBe(0)
  })
})
