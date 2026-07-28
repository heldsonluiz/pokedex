import "server-only"

const DEFAULT_CALLBACK_PATH = "/home"
const URL_PARSING_BASE = "http://internal"

const ALLOWED_CALLBACK_PATHS = ["/home", "/profile", "/qr"] as const

export function getSafeCallbackPath(callbackUrl: string | undefined) {
  if (!callbackUrl) {
    return DEFAULT_CALLBACK_PATH
  }

  try {
    const destination = new URL(callbackUrl, URL_PARSING_BASE)

    const isAllowedPath = ALLOWED_CALLBACK_PATHS.some(
      (path) =>
        destination.pathname === path ||
        destination.pathname.startsWith(`${path}/`)
    )

    if (!isAllowedPath) {
      return DEFAULT_CALLBACK_PATH
    }

    return `${destination.pathname}${destination.search}`
  } catch {
    return DEFAULT_CALLBACK_PATH
  }
}
