export const RAFFLE_LIVE_CHANNEL = "pokedex-raffle-live"

export type RaffleLiveEvent =
  "raffle-drawing" | "raffle-updated" | "raffle-drawing-cancelled"

export function notifyRaffleLiveDisplay(type: RaffleLiveEvent) {
  if (typeof BroadcastChannel === "undefined") {
    return
  }

  const channel = new BroadcastChannel(RAFFLE_LIVE_CHANNEL)
  channel.postMessage({ type })
  channel.close()
}
