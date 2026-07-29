"use server"

import { revalidatePath } from "next/cache"

import { requireAuth } from "@/lib/require-auth"

import {
  archiveRaffleSimulationForSession,
  beginRaffleClosureForSession,
  confirmRaffleWinnerForSession,
  drawRaffleForSession,
  processRaffleClosureForSession,
  processRaffleSimulationForSession,
  rerollRaffleForSession,
  startRaffleSimulationForSession,
  updatePostRaffleRedemptionsForSession,
} from "./raffle.service"

export async function beginRaffleClosureAction() {
  const session = await requireAuth()
  const authorized = await beginRaffleClosureForSession(session)

  if (!authorized) {
    throw new Error("Operation is not authorized")
  }

  revalidatePath("/operations")
  revalidatePath("/tickets")
}

export async function processRaffleClosureBatchAction() {
  const session = await requireAuth()
  const result = await processRaffleClosureForSession(session)

  if (!result) {
    throw new Error("Operation is not authorized")
  }

  revalidatePath("/operations")
  revalidatePath("/tickets")
}

export async function drawRaffleAction(formData: FormData) {
  const session = await requireAuth()
  const raffleId = String(formData.get("raffleId") ?? "")
  const result = await drawRaffleForSession(session, raffleId)

  if (!result) {
    throw new Error("Operation is not authorized")
  }

  revalidatePath("/operations")
}

export async function confirmRaffleWinnerAction(formData: FormData) {
  const session = await requireAuth()
  const raffleId = String(formData.get("raffleId") ?? "")
  const attemptId = String(formData.get("attemptId") ?? "")
  const result = await confirmRaffleWinnerForSession(
    session,
    raffleId,
    attemptId
  )

  if (!result || result !== "confirmed") {
    throw new Error("Raffle winner cannot be confirmed")
  }

  revalidatePath("/operations")
}

export async function rerollRaffleAction(formData: FormData) {
  const session = await requireAuth()
  const raffleId = String(formData.get("raffleId") ?? "")
  const attemptId = String(formData.get("attemptId") ?? "")
  const result = await rerollRaffleForSession(session, raffleId, attemptId)

  if (!result || result.status === "unavailable") {
    throw new Error("Raffle cannot be rerolled")
  }

  revalidatePath("/operations")
}

export async function togglePostRaffleRedemptionsAction(formData: FormData) {
  const session = await requireAuth()
  const enabled = formData.get("enabled") === "true"
  const result = await updatePostRaffleRedemptionsForSession(session, enabled)

  if (!result || result !== "updated") {
    throw new Error("Post-raffle redemptions cannot be updated")
  }

  revalidatePath("/operations")
}

export async function startRaffleSimulationAction() {
  const session = await requireAuth()
  const result = await startRaffleSimulationForSession(session)

  if (!result) {
    throw new Error("Raffle simulation cannot be started")
  }

  revalidatePath("/operations")
}

export async function processRaffleSimulationBatchAction() {
  const session = await requireAuth()
  const result = await processRaffleSimulationForSession(session)

  if (!result) {
    throw new Error("Raffle simulation cannot be processed")
  }

  revalidatePath("/operations")
}

export async function archiveRaffleSimulationAction() {
  const session = await requireAuth()
  const archived = await archiveRaffleSimulationForSession(session)

  if (!archived) {
    throw new Error("Raffle simulation cannot be archived")
  }

  revalidatePath("/operations")
}
