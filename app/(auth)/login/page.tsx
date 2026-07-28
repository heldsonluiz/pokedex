import { LoginExperience } from "@/components/auth/login-experience"
import { getAuthErrorMessage } from "@/lib/get-auth-error-message"
import { getSafeCallbackPath } from "@/lib/get-safe-callback-path"

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    callbackUrl?: string | string[]
    error?: string | string[]
  }>
}>

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined
  const redirectTo = getSafeCallbackPath(callbackUrl)
  const authError = typeof params.error === "string" ? params.error : undefined
  const errorMessage = getAuthErrorMessage(authError)

  return <LoginExperience redirectTo={redirectTo} errorMessage={errorMessage} />
}
