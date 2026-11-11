import { createCatalogFixture, deterministicUuid } from "./event-test-data.mjs"

// Separate fixture: the general-purpose dataset remains unchanged.
export function createVolunteerFixture(options) {
  const documents = createCatalogFixture(options)
  const targets = [2, 5, 10]
  let connectionIndex = 0
  for (const item of documents) {
    if (item.collection !== "missions") continue
    const mission = item.data
    if (mission.progressRequirement?.type === "connections") {
      const target = targets[connectionIndex++]
      item.id = `conecte-${target}-participantes`
      mission.id = item.id
      mission.title = `Conecte-se com ${target} participantes`
      mission.description = `Crie conexões com ${target} pessoas diferentes do grupo de testes.`
      mission.progressRequirement = { ...mission.progressRequirement, target }
    }
    if (["visita-aurora", "desafio-byte-forge"].includes(item.id)) {
      mission.validationType = "qr"
      mission.qrId = deterministicUuid("mission", item.id)
      mission.description =
        "Primeiro escaneie a empresa. Depois leia o QR desta missão no kit de testes."
    }
  }
  const additions = [
    ["caldeirao-do-codigo", "Caldeirão do Código", "code-cauldron"],
    ["guardiao-dos-dados", "Guardião dos Dados", "data-crypt"],
  ]
  for (const [id, title, company] of additions) {
    documents.push({
      collection: "missions",
      id,
      data: {
        id,
        eventId: options.eventId,
        title,
        description:
          "Primeiro escaneie a empresa. Depois leia o QR desta missão no kit de testes.",
        qrId: deterministicUuid("mission", id),
        imageUrl: new URL(
          `/images/assets/missions/${id}.png`,
          options.appOrigin
        ).toString(),
        validationType: "qr",
        progressRequirement: null,
        prerequisites: [{ type: "company", activityId: company }],
        active: true,
        order: 15 + additions.findIndex((entry) => entry[0] === id),
        xpAwarded: 50,
        createdAt: options.now,
        updatedAt: options.now,
      },
    })
  }
  documents.push({
    collection: "eventOperations",
    id: options.eventId,
    data: {
      eventId: options.eventId,
      ticketConversionEnabled: true,
      rewardRedemptionEnabled: true,
      raffleClosureStatus: "open",
      raffleClosureCursor: null,
      raffleProcessedParticipants: 0,
      raffleSkippedParticipants: 0,
      raffleSnapshotAt: null,
      raffleClosedAt: null,
      updatedAt: options.now,
      updatedBy: "volunteer-seed",
    },
  })
  return documents
}
