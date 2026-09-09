// A timeout does not cancel the server operation. Retrying must remain idempotent.
export async function awaitScannerRequest<T>(request: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Scanner request timed out")),
          15_000
        )
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}
