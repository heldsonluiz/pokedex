import "server-only"

import type { Session } from "next-auth"

import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"

import {
  beginRaffleClosure,
  confirmRaffleWinner,
  drawRaffle,
  findRaffleClosureState,
  findRaffles,
  processRaffleClosureBatch,
  rerollRaffle,
  setPostRaffleRedemptionsEnabled,
} from "./raffle.repository"
import {
  archiveRaffleSimulation,
  confirmSimulationWinner,
  drawSimulationRaffle,
  findActiveRaffleSimulation,
  findSimulationRaffles,
  processRaffleSimulationBatch,
  rerollSimulationRaffle,
  setSimulationRedemptionsEnabled,
  startRaffleSimulation,
} from "./raffle-simulation.repository"

async function requireRaffleAdministrator(session: Session) {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "manage-event-operations")) {
    return null
  }

  return profile
}

export async function getRaffleOperationsForSession(session: Session) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  const [closure, raffles] = await Promise.all([
    findRaffleClosureState(profile.eventId),
    findRaffles(profile.eventId),
  ])
  const simulation = await findActiveRaffleSimulation(profile.eventId)

  return {
    closure,
    raffles,
    simulation: simulation
      ? {
          ...simulation,
          raffles: await findSimulationRaffles(simulation.id),
        }
      : null,
  }
}

export async function beginRaffleClosureForSession(session: Session) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return false
  }

  if (await findActiveRaffleSimulation(profile.eventId)) {
    return false
  }

  await beginRaffleClosure(profile.eventId, profile.userId)

  return true
}

export async function processRaffleClosureForSession(session: Session) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  if (await findActiveRaffleSimulation(profile.eventId)) {
    return null
  }

  return processRaffleClosureBatch(profile.eventId, profile.userId)
}

export async function drawRaffleForSession(session: Session, raffleId: string) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  const simulation = await findActiveRaffleSimulation(profile.eventId)

  if (simulation) {
    return drawSimulationRaffle(
      profile.eventId,
      simulation.id,
      raffleId,
      profile.userId
    )
  }

  return drawRaffle(profile.eventId, raffleId, profile.userId)
}

export async function confirmRaffleWinnerForSession(
  session: Session,
  raffleId: string,
  attemptId: string
) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  const simulation = await findActiveRaffleSimulation(profile.eventId)

  if (simulation) {
    return confirmSimulationWinner(
      profile.eventId,
      simulation.id,
      raffleId,
      attemptId,
      profile.userId
    )
  }

  return confirmRaffleWinner(
    profile.eventId,
    raffleId,
    profile.userId,
    attemptId
  )
}

export async function rerollRaffleForSession(
  session: Session,
  raffleId: string,
  attemptId: string
) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  const simulation = await findActiveRaffleSimulation(profile.eventId)

  if (simulation) {
    return rerollSimulationRaffle(
      profile.eventId,
      simulation.id,
      raffleId,
      attemptId,
      profile.userId
    )
  }

  return rerollRaffle(profile.eventId, raffleId, profile.userId, attemptId)
}

export async function updatePostRaffleRedemptionsForSession(
  session: Session,
  enabled: boolean
) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  const simulation = await findActiveRaffleSimulation(profile.eventId)

  if (simulation) {
    return setSimulationRedemptionsEnabled(
      profile.eventId,
      simulation.id,
      profile.userId,
      enabled
    )
  }

  return setPostRaffleRedemptionsEnabled(
    profile.eventId,
    profile.userId,
    enabled
  )
}

export async function startRaffleSimulationForSession(session: Session) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  return startRaffleSimulation(profile.eventId, profile.userId)
}

export async function processRaffleSimulationForSession(session: Session) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return null
  }

  return processRaffleSimulationBatch(profile.eventId, profile.userId)
}

export async function archiveRaffleSimulationForSession(session: Session) {
  const profile = await requireRaffleAdministrator(session)

  if (!profile) {
    return false
  }

  const simulation = await findActiveRaffleSimulation(profile.eventId)

  if (!simulation) {
    return false
  }

  return archiveRaffleSimulation(profile.eventId, simulation.id, profile.userId)
}
