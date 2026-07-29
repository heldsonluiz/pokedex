export type WeightedCandidate = Readonly<{
  participantId: string
  ticketWeight: number
}>

export function selectWeightedCandidate<Candidate extends WeightedCandidate>(
  candidates: Candidate[],
  randomOffset: number
): Candidate | null {
  const totalWeight = candidates.reduce(
    (total, candidate) => total + candidate.ticketWeight,
    0
  )

  if (
    totalWeight <= 0 ||
    !Number.isInteger(randomOffset) ||
    randomOffset < 0 ||
    randomOffset >= totalWeight
  ) {
    return null
  }

  let accumulatedWeight = 0

  for (const candidate of candidates) {
    accumulatedWeight += candidate.ticketWeight

    if (randomOffset < accumulatedWeight) {
      return candidate
    }
  }

  return null
}
