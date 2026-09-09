import type { ParseQrCodeUrlResult } from "@/modules/qr-code/qr-code.contract"

export type ScannerFailure =
  | "permission-denied"
  | "camera-unavailable"
  | "camera-busy"
  | "insecure-context"
  | "offline"
  | "invalid-qr"
  | "invalid-origin"
  | "invalid-event"
  | "unsupported-type"
  | "target-unavailable"
  | "validation-failed"
  | "unexpected"

export type ScannerFeedback = Readonly<{
  title: string
  description: string
}>

const scannerFailureFeedback: Record<ScannerFailure, ScannerFeedback> = {
  "permission-denied": {
    title: "A câmera está bloqueada",
    description:
      "Permita o acesso à câmera nas configurações do navegador e tente novamente.",
  },
  "camera-unavailable": {
    title: "Câmera indisponível",
    description:
      "Não encontramos uma câmera compatível neste dispositivo ou navegador.",
  },
  "camera-busy": {
    title: "A câmera está em uso",
    description:
      "Feche outros aplicativos que estejam usando a câmera e tente novamente.",
  },
  "insecure-context": {
    title: "Conexão segura necessária",
    description:
      "Abra o aplicativo pelo endereço seguro oficial do evento para usar a câmera.",
  },
  offline: {
    title: "Sem conexão",
    description:
      "Conecte-se à internet para validar o QR Code e tente novamente.",
  },
  "invalid-qr": {
    title: "QR Code inválido",
    description: "Este código não possui um formato reconhecido pelo evento.",
  },
  "invalid-origin": {
    title: "QR Code externo",
    description: "Este código não pertence à aplicação oficial do evento.",
  },
  "invalid-event": {
    title: "QR Code de outro evento",
    description: "Este código não pertence à edição atual do evento.",
  },
  "unsupported-type": {
    title: "Tipo não reconhecido",
    description: "Este tipo de QR Code não é aceito pela aplicação.",
  },
  "target-unavailable": {
    title: "Leia o QR Code de um participante",
    description:
      "Nesta tela, use o QR Code exibido no perfil do participante. Códigos de empresas, tags e missões devem ser lidos no scanner do evento.",
  },
  "validation-failed": {
    title: "Não foi possível confirmar a leitura",
    description:
      "Verifique sua conexão e leia o QR Code novamente. Se a operação já foi registrada, o XP não será duplicado.",
  },
  unexpected: {
    title: "Não foi possível abrir o scanner",
    description: "Tente novamente. Se o erro continuar, reinicie o navegador.",
  },
}

export function getScannerFeedback(failure: ScannerFailure) {
  return scannerFailureFeedback[failure]
}

export function classifyCameraError(error: unknown): ScannerFailure {
  if (!(error instanceof DOMException)) {
    return "unexpected"
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "permission-denied"
    case "NotFoundError":
    case "OverconstrainedError":
      return "camera-unavailable"
    case "AbortError":
    case "NotReadableError":
    case "TrackStartError":
      return "camera-busy"
    case "SecurityError":
      return "insecure-context"
    default:
      return "unexpected"
  }
}

export function mapQrCodeError(
  result: Extract<ParseQrCodeUrlResult, { valid: false }>
): ScannerFailure {
  switch (result.code) {
    case "INVALID_ORIGIN":
      return "invalid-origin"
    case "INVALID_EVENT":
      return "invalid-event"
    case "UNSUPPORTED_QR_TYPE":
      return "unsupported-type"
    case "INVALID_QR":
    case "MISSING_TOKEN":
      return "invalid-qr"
  }
}
