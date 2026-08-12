import type { ScheduleEntry, ScheduleTrack } from "./schedule.schema"

const TRACK_LABELS: Record<ScheduleTrack, string> = {
  MINAS: "Minas",
  CURADO: "Curado",
  CANASTRA: "Canastra",
  TRANCA: "Trança",
  COMUNIDADE: "Comunidade",
}

const ACTIVITY_LABELS = {
  talk: "Palestra",
  opening: "Abertura",
  closing: "Encerramento",
} as const

export function formatScheduleTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

export function formatScheduleInterval(startAt: Date, endAt: Date) {
  return `${formatScheduleTime(startAt)}–${formatScheduleTime(endAt)}`
}

export function formatScheduleLocation(
  track: ScheduleTrack | null,
  activityType: Exclude<ScheduleEntry["activity"]["type"], "break">
) {
  return track ? `Trilha ${TRACK_LABELS[track]}` : ACTIVITY_LABELS[activityType]
}
