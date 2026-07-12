import { SignOutButton } from "@/components/auth/sign-out-button"
import { signOutCurrentUser } from "@/modules/auth/auth.actions"

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-pixel-square text-2xl">Área autenticada</h1>

      <form action={signOutCurrentUser}>
        <SignOutButton />
      </form>
    </main>
  )
}
