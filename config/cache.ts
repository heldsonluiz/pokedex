export const CACHE_SECONDS = {
  EVENT_CATALOG: 15 * 60,
  RAFFLE_SNAPSHOT: 24 * 60 * 60,
  REWARD_CATALOG: 30,
} as const

export const CACHE_TAGS = {
  COMPANIES: "catalog:companies",
  MISSIONS: "catalog:missions",
  RAFFLE_SNAPSHOTS: "raffles:snapshots",
  REWARDS: "catalog:rewards",
  TAGS: "catalog:tags",
} as const
