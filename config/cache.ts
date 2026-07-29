export const CACHE_SECONDS = {
  EVENT_CATALOG: 15 * 60,
  REWARD_CATALOG: 30,
} as const

export const CACHE_TAGS = {
  COMPANIES: "catalog:companies",
  MISSIONS: "catalog:missions",
  REWARDS: "catalog:rewards",
  TAGS: "catalog:tags",
} as const
