"use client"

import { toast } from "sonner"

import {
  archiveRaffleSimulationAction,
  beginRaffleClosureAction,
  confirmRaffleWinnerAction,
  drawRaffleAction,
  processRaffleClosureBatchAction,
  processRaffleSimulationBatchAction,
  rerollRaffleAction,
  startRaffleSimulationAction,
  togglePostRaffleRedemptionsAction,
} from "./raffle.actions"
import { notifyRaffleLiveDisplay } from "./raffle-live-channel"

async function runAndNotify(
  action: () => Promise<void>,
  options: Readonly<{
    drawingPrizeName?: string
    errorMessage: string
    propagateError?: boolean
  }>
) {
  const { drawingPrizeName, errorMessage, propagateError = false } = options

  if (drawingPrizeName) {
    notifyRaffleLiveDisplay("raffle-drawing", {
      prizeName: drawingPrizeName,
    })
  }

  try {
    await action()
    notifyRaffleLiveDisplay("raffle-updated")
  } catch (error) {
    if (drawingPrizeName) {
      notifyRaffleLiveDisplay("raffle-drawing-cancelled")
    }

    if (propagateError) {
      throw error
    }

    toast.error(errorMessage, {
      description:
        "A operação não foi concluída. Verifique sua conexão e tente novamente.",
      duration: 5_000,
    })
  }
}

export async function beginRaffleClosureAndNotify() {
  await runAndNotify(beginRaffleClosureAction, {
    errorMessage: "Não foi possível iniciar o fechamento",
  })
}

export async function processRaffleClosureBatchAndNotify() {
  await runAndNotify(processRaffleClosureBatchAction, {
    errorMessage: "O fechamento foi interrompido",
    propagateError: true,
  })
}

export async function drawRaffleAndNotify(formData: FormData) {
  const prizeName = formData.get("prizeName")

  await runAndNotify(() => drawRaffleAction(formData), {
    drawingPrizeName: typeof prizeName === "string" ? prizeName : undefined,
    errorMessage: "Não foi possível realizar o sorteio",
  })
}

export async function confirmRaffleWinnerAndNotify(formData: FormData) {
  await runAndNotify(() => confirmRaffleWinnerAction(formData), {
    errorMessage: "Não foi possível confirmar o vencedor",
  })
}

export async function rerollRaffleAndNotify(formData: FormData) {
  const prizeName = formData.get("prizeName")

  await runAndNotify(() => rerollRaffleAction(formData), {
    drawingPrizeName: typeof prizeName === "string" ? prizeName : undefined,
    errorMessage: "Não foi possível sortear outra pessoa",
  })
}

export async function togglePostRaffleRedemptionsAndNotify(formData: FormData) {
  await runAndNotify(() => togglePostRaffleRedemptionsAction(formData), {
    errorMessage: "Não foi possível alterar os resgates",
  })
}

export async function startRaffleSimulationAndNotify() {
  await runAndNotify(startRaffleSimulationAction, {
    errorMessage: "Não foi possível iniciar o modo de teste",
  })
}

export async function processRaffleSimulationBatchAndNotify() {
  await runAndNotify(processRaffleSimulationBatchAction, {
    errorMessage: "A preparação da simulação foi interrompida",
    propagateError: true,
  })
}

export async function archiveRaffleSimulationAndNotify() {
  await runAndNotify(archiveRaffleSimulationAction, {
    errorMessage: "Não foi possível encerrar o modo de teste",
  })
}
