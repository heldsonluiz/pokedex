/**
 * Restaura um participante identificado pelo e-mail dentro do EVENT_ID atual.
 *
 * Remove perfil e atividades, compensa XP e contadores das conexões, devolve
 * brindes ao estoque e limpa referências de sorteios. A conta no Firebase
 * Authentication e os arquivos do Storage não são removidos.
 *
 * Simular, sem fazer gravações:
 *   npm run db:reset-participant -- --email participante@exemplo.com
 *
 * Ao final da simulação, o terminal exibirá o comando completo para realizar
 * a remoção. Confira projeto, evento e e-mail e então copie e execute a linha
 * inteira, que incluirá --apply e uma confirmação exclusiva dessa operação.
 * Se uma versão antiga falhou somente depois de confirmar a compensação, use
 * também --recovery compensated para retomar sem descontar XP ou repor estoque
 * uma segunda vez. Essa opção não deve ser usada em uma execução normal.
 */
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import {
  assertDestructiveConfirmation,
  deleteDocumentTrees,
  deleteReferences,
  getFirestoreCollectionName,
  initializeFirestore,
  loadLocalEnvironment,
  parseArguments,
  requireEnvironment,
} from "./lib/firestore-admin.mjs"

await loadLocalEnvironment()
const args = parseArguments()
const email = args.email?.trim().toLocaleLowerCase("pt-BR")
if (!email)
  throw new Error(
    "Uso: npm run db:reset-participant -- --email pessoa@exemplo.com"
  )

const eventId = requireEnvironment("EVENT_ID")
const { firestore, projectId } = initializeFirestore()
const profiles = await firestore
  .collection(getFirestoreCollectionName("profiles"))
  .where("email", "==", email)
  .limit(10)
  .get()
const eventProfiles = profiles.docs.filter(
  (document) => document.data().eventId === eventId
)

if (eventProfiles.length === 0)
  throw new Error(`Nenhum participante encontrado para ${email}.`)
if (eventProfiles.length > 1)
  throw new Error(`E-mail duplicado no evento: ${email}.`)

const profile = eventProfiles[0]
const participantId = profile.id
const participantCollections = [
  "missionAttempts",
  "activityCompletions",
  "participantSummaries",
  "rewardRedemptions",
  "talk-ratings",
  "ticketTransactions",
  "raffleAttempts",
  "raffleSkippedProfiles",
  "raffleWinners",
]
const snapshots = await Promise.all(
  participantCollections.map((collection) =>
    firestore
      .collection(getFirestoreCollectionName(collection))
      .where("participantId", "==", participantId)
      .get()
  )
)
const byCollection = Object.fromEntries(
  participantCollections.map((name, index) => [name, snapshots[index]])
)
const connections = await firestore
  .collection(getFirestoreCollectionName("connections"))
  .where("participantIds", "array-contains", participantId)
  .get()
const chunks = await firestore
  .collection(getFirestoreCollectionName("raffleEntryChunks"))
  .where("eventId", "==", eventId)
  .get()
const raffles = await firestore
  .collection(getFirestoreCollectionName("raffles"))
  .where("eventId", "==", eventId)
  .get()
const testRuns = await firestore
  .collection(getFirestoreCollectionName("raffleTestRuns"))
  .where("eventId", "==", eventId)
  .get()

const rewardRestocks = new Map()
for (const redemption of byCollection.rewardRedemptions.docs) {
  const data = redemption.data()
  rewardRestocks.set(
    data.rewardId,
    (rewardRestocks.get(data.rewardId) ?? 0) + (data.quantity ?? 0)
  )
}
const acceptedConnections = connections.docs.filter(
  (document) => document.data().status === "accepted"
)
const resumeAfterCompensation = args.recovery === "compensated"
if (args.recovery && !resumeAfterCompensation)
  throw new Error('Recuperação desconhecida. Use apenas "compensated".')
if (resumeAfterCompensation && !args.apply)
  throw new Error("--recovery compensated só pode ser usado junto com --apply.")
const plan = {
  mode: args.apply ? "APLICAÇÃO" : "SIMULAÇÃO (nenhuma gravação)",
  projectId,
  eventId,
  participant: {
    id: participantId,
    email,
    displayName: profile.data().displayName,
  },
  documentsToDelete:
    1 +
    connections.size +
    snapshots.reduce((total, snapshot) => total + snapshot.size, 0),
  acceptedConnectionsToCompensate: acceptedConnections.length,
  rewardsToRestock: Object.fromEntries(rewardRestocks),
  raffleChunksToRewrite: chunks.docs.filter((document) =>
    document
      .data()
      .participants?.some((item) => item.participantId === participantId)
  ).length,
  testSimulationsToDiscard: testRuns.size,
  recovery: resumeAfterCompensation
    ? "RETOMADA APÓS COMPENSAÇÃO JÁ APLICADA"
    : null,
}
console.log(JSON.stringify(plan, null, 2))

const expected = `RESET_PARTICIPANT:${projectId}:${eventId}:${email}`
if (
  !assertDestructiveConfirmation({
    args,
    expected,
    action: "Limpeza do participante",
  })
) {
  console.log(
    `\nPara aplicar: npm run db:reset-participant -- --email "${email}" --apply --confirm "${expected}"`
  )
  process.exit(0)
}

const now = Timestamp.now()
if (!resumeAfterCompensation) {
  console.log("Compensando conexões e estoque...")
  await firestore.runTransaction(async (transaction) => {
    const rewardReads = [...rewardRestocks].map(([rewardId]) => ({
      reference: firestore
        .collection(getFirestoreCollectionName("rewards"))
        .doc(rewardId),
    }))
    const peerReads = acceptedConnections.map((connection) => {
      const peerId = connection
        .data()
        .participantIds.find((id) => id !== participantId)
      return {
        connection,
        profileRef: firestore
          .collection(getFirestoreCollectionName("profiles"))
          .doc(peerId),
        summaryQuery: firestore
          .collection(getFirestoreCollectionName("participantSummaries"))
          .where("eventId", "==", eventId)
          .where("participantId", "==", peerId)
          .limit(1),
      }
    })
    const rewardSnapshots = await Promise.all(
      rewardReads.map((item) => transaction.get(item.reference))
    )
    const peerSnapshots = await Promise.all(
      peerReads.map(async (item) => ({
        profile: await transaction.get(item.profileRef),
        summaries: await transaction.get(item.summaryQuery),
      }))
    )

    rewardSnapshots.forEach((reward, index) => {
      if (!reward.exists)
        throw new Error(
          `Brinde ausente; estoque não pode ser restaurado: ${rewardReads[index].reference.id}`
        )
      transaction.update(reward.ref, {
        stock: FieldValue.increment(rewardRestocks.get(reward.id)),
        updatedAt: now,
      })
    })
    peerSnapshots.forEach(({ profile: peer, summaries }, index) => {
      if (!peer.exists) return
      const xpToRevoke =
        peerReads[index].connection.data().xpAwardedPerParticipant ?? 0
      transaction.update(peer.ref, {
        xp: Math.max(0, (peer.data().xp ?? 0) - xpToRevoke),
        xpReachedAt: now,
        updatedAt: now,
      })
      if (!summaries.empty) {
        const summary = summaries.docs[0]
        transaction.update(summary.ref, {
          connectionsCount: Math.max(
            0,
            (summary.data().connectionsCount ?? 0) - 1
          ),
          updatedAt: now,
        })
      }
    })
  })
  console.log("Compensações concluídas.")
} else {
  console.log("Compensações já aplicadas; retomando a partir da limpeza.")
}

const raffleMutations = []
for (const chunk of chunks.docs) {
  const participants =
    chunk
      .data()
      .participants?.filter((item) => item.participantId !== participantId) ??
    []
  if (participants.length === chunk.data().participants?.length) continue
  if (participants.length === 0)
    raffleMutations.push({ type: "delete", reference: chunk.ref })
  else
    raffleMutations.push({
      type: "update",
      reference: chunk.ref,
      data: { participants },
    })
}
for (const raffle of raffles.docs) {
  const data = raffle.data()
  if (
    data.currentCandidateId !== participantId &&
    data.winnerId !== participantId
  )
    continue
  raffleMutations.push({
    type: "update",
    reference: raffle.ref,
    data: {
      status: "pending",
      currentAttemptId: null,
      currentCandidateId: null,
      currentCandidateName: null,
      winnerId: null,
      winnerName: null,
      eligibleParticipantCount: null,
      eligibleTicketTotal: null,
      randomOffset: null,
      drawnAt: null,
      drawnBy: null,
      updatedAt: now,
    },
  })
}
for (let offset = 0; offset < raffleMutations.length; offset += 400) {
  const batch = firestore.batch()
  for (const mutation of raffleMutations.slice(offset, offset + 400)) {
    if (mutation.type === "delete") batch.delete(mutation.reference)
    else batch.update(mutation.reference, mutation.data)
  }
  await batch.commit()
}
console.log("Referências dos sorteios reais revisadas.")

// Simulações são fotografias descartáveis. Manter uma após remover um perfil
// produziria um cenário que já não representa a base atual.
console.log(
  `Mapeando ${testRuns.size} simulações de sorteio e suas subcoleções...`
)
await deleteDocumentTrees(
  firestore,
  testRuns.docs.map((run) => run.ref),
  {
    onTreeCollected: ({ current, total, documents }) =>
      console.log(
        `Simulação ${current}/${total} mapeada (${documents} documentos).`
      ),
    onBatchCommitted: ({ deleted, total }) =>
      console.log(`Simulações removidas: ${deleted}/${total} documentos.`),
  }
)

const references = [profile.ref, ...connections.docs.map((item) => item.ref)]
for (const snapshot of snapshots)
  references.push(...snapshot.docs.map((item) => item.ref))
console.log(`Removendo ${references.length} documentos do participante...`)
await deleteReferences(firestore, references, {
  onBatchCommitted: ({ deleted, total }) =>
    console.log(`Documentos do participante removidos: ${deleted}/${total}.`),
})
console.log(
  `Participante ${email} removido e dependências compensadas com sucesso.`
)
