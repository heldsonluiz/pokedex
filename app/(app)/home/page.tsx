import { SignOutButton } from "@/components/auth/sign-out-button"
import { signOutCurrentUser } from "@/modules/auth/auth.actions"

export default function HomePage() {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-2">
        <h1 className="font-pixel-square text-2xl">Área autenticada</h1>
        <p className="text-sm text-muted-foreground">
          Seu resumo do evento será construído na próxima fase.
        </p>
      </div>

      <form action={signOutCurrentUser}>
        <SignOutButton />
      </form>
    </section>
  )
}
