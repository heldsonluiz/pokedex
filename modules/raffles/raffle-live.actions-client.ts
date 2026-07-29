"use client"

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
  announceDrawing = false
) {
  if (announceDrawing) {
    notifyRaffleLiveDisplay("raffle-drawing")
  }

  try {
    await action()
    notifyRaffleLiveDisplay("raffle-updated")
  } catch (error) {
    if (announceDrawing) {
      notifyRaffleLiveDisplay("raffle-drawing-cancelled")
    }

    throw error
  }
}

export async function beginRaffleClosureAndNotify() {
  await runAndNotify(beginRaffleClosureAction)
}

export async function processRaffleClosureBatchAndNotify() {
  await runAndNotify(processRaffleClosureBatchAction)
}

export async function drawRaffleAndNotify(formData: FormData) {
  await runAndNotify(() => drawRaffleAction(formData), true)
}

export async function confirmRaffleWinnerAndNotify(formData: FormData) {
  await runAndNotify(() => confirmRaffleWinnerAction(formData))
}

export async function rerollRaffleAndNotify(formData: FormData) {
  await runAndNotify(() => rerollRaffleAction(formData), true)
}

export async function togglePostRaffleRedemptionsAndNotify(formData: FormData) {
  await runAndNotify(() => togglePostRaffleRedemptionsAction(formData))
}

export async function startRaffleSimulationAndNotify() {
  await runAndNotify(startRaffleSimulationAction)
}

export async function processRaffleSimulationBatchAndNotify() {
  await runAndNotify(processRaffleSimulationBatchAction)
}

export async function archiveRaffleSimulationAndNotify() {
  await runAndNotify(archiveRaffleSimulationAction)
}
