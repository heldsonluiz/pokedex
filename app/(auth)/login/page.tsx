import Image from "next/image"
import { redirect } from "next/navigation"

import { SignInButton } from "@/components/auth/sign-in-button"
import { auth } from "@/lib/auth"
import { getAuthErrorMessage } from "@/lib/get-auth-error-message"
import { getSafeCallbackPath } from "@/lib/get-safe-callback-path"
import { signInWithGoogle } from "@/modules/auth/auth.actions"

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
  const session = await auth()

  const authError = typeof params.error === "string" ? params.error : undefined
  const errorMessage = getAuthErrorMessage(authError)

  if (session?.user) {
    redirect(`/auth/complete?callbackUrl=${encodeURIComponent(redirectTo)}`)
  }

  return (
    <div className="grid min-h-full grid-rows-[60px_minmax(14rem,0.9fr)_auto] gap-4 px-6 pt-12 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header className="flex justify-center">
        <Image
          src="/images/brand/devfest-logo.png"
          alt="DevFest Triângulo"
          width={194}
          height={60}
          className="h-auto w-48"
        />
      </header>

      <div aria-hidden="true" className="relative mx-auto w-full max-w-sm">
        <Image
          src="/images/assets/auth/login-hero.png"
          alt=""
          fill
          priority
          sizes="(max-width: 430px) 100vw, 382px"
          className="object-contain px-4"
        />
      </div>

      <section
        aria-labelledby="login-title"
        className="flex flex-col items-center text-center"
      >
        <h1 id="login-title" className="text-3xl font-bold tracking-tight">
          Sua jornada começa aqui
        </h1>

        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Entre com sua conta Google para participar das missões, criar conexões
          e acompanhar seu progresso no DevFest.
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 w-full rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        )}

        <form action={signInWithGoogle} className="mt-6 w-full">
          <input type="hidden" name="callbackUrl" value={redirectTo} />
          <SignInButton />
        </form>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Ao continuar, você concorda com o uso dos dados necessários para sua
          participação no evento.
        </p>
      </section>
    </div>
  )
}
