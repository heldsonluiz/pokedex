export { auth as proxy } from "@/lib/auth"

export const config = {
  matcher: ["/home/:path*", "/onboarding/:path*", "/profile/:path*"],
}
