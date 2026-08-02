"use client"

import { Gift, Sparkles, Ticket, TriangleAlert, Zap } from "lucide-react"
import { useRef, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STORAGE_PREFIX = "tickets-introduction:v1"
const subscribeToLocalStorage = () => () => undefined

export function TicketIntroductionDialog({
  storageScope,
}: Readonly<{ storageScope: string }>) {
  const [dismissed, setDismissed] = useState(false)
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const storageKey = `${STORAGE_PREFIX}:${storageScope}`
  const unseen = useSyncExternalStore(
    subscribeToLocalStorage,
    () => {
      try {
        return window.localStorage.getItem(storageKey) !== "seen"
      } catch {
        return true
      }
    },
    () => false
  )
  const open = unseen && !dismissed

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return
    setDismissed(true)

    try {
      window.localStorage.setItem(storageKey, "seen")
    } catch {
      // O diálogo continua funcionando quando o navegador bloqueia storage.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent ref={dialogContentRef} initialFocus={dialogContentRef}>
        <DialogHeader className="items-center px-8 text-center">
          <span className="flex size-20 items-center justify-center rounded-3xl bg-gamification/15 text-gamification shadow-glow-gamification">
            <Ticket className="size-10" aria-hidden="true" />
          </span>
          <DialogTitle className="mt-2 text-xl leading-snug">
            Como funcionam os tickets?
          </DialogTitle>
          <DialogDescription className="leading-6">
            Transforme o XP conquistado durante o evento em escolhas entre
            brindes e mais chances nos sorteios finais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          <GuideItem icon={Zap} title="Converta XP">
            Seus pontos de XP disponíveis podem ser convertidos em tickets.
          </GuideItem>
          <GuideItem icon={Gift} title="Resgate brindes">
            Na lojinha, cada brinde possui um preço específico em tickets.
          </GuideItem>
          <GuideItem icon={Sparkles} title="Aumente suas chances">
            Quanto mais tickets disponíveis no momento do sorteio, maiores são
            suas chances de ganhar.
          </GuideItem>
          <GuideItem icon={Ticket} title="Você escolhe">
            Gaste seus tickets em brindes ou guarde-os para aumentar suas
            chances nos sorteios finais.
          </GuideItem>
          <div className="flex gap-3 rounded-xl bg-destructive/10 p-3 text-destructive">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm leading-5 font-medium">
              Tickets e pontos gastos não são reembolsáveis. Confirme sua
              escolha antes de converter ou resgatar.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row">
          <DialogClose render={<Button className="flex-1" />}>
            Entendi
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GuideItem({
  icon: Icon,
  title,
  children,
}: Readonly<{
  icon: typeof Ticket
  title: string
  children: string
}>) {
  return (
    <div className="flex gap-3 rounded-xl bg-muted/60 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gamification/10 text-gamification">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
          {children}
        </p>
      </div>
    </div>
  )
}
