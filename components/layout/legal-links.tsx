import Link from "next/link"
export function LegalLinks() {
  return (
    <footer
      aria-label="Informações legais e contato"
      className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 py-5 text-center text-xs text-muted-foreground"
    >
      <Link className="underline" href="/privacidade">
        Privacidade
      </Link>
      <Link className="underline" href="/termos">
        Termos de uso
      </Link>
      <a className="break-all underline" href="mailto:gdg.uberlandia@gmail.com">
        gdg.uberlandia@gmail.com
      </a>
    </footer>
  )
}
