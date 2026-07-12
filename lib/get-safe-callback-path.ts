import "server-only"

const DEFAULT_CALLBACK_PATH = "/home"
const URL_PARSING_BASE = "http://internal"

export function getSafeCallbackPath(callbackUrl: string | undefined) {
  if (!callbackUrl) {
    return DEFAULT_CALLBACK_PATH
  }

  try {
    const destination = new URL(callbackUrl, URL_PARSING_BASE)

    const isProtectedPath =
      destination.pathname === "/home" ||
      destination.pathname.startsWith("/home/")

    if (!isProtectedPath) {
      return DEFAULT_CALLBACK_PATH
    }

    return `${destination.pathname}${destination.search}`
  } catch {
    return DEFAULT_CALLBACK_PATH
  }
}
