/**
 * Esvazia integralmente o Firestore para preparar o ambiente de lançamento.
 *
 * Remove documentos de todas as coleções e subcoleções, inclusive coleções
 * desconhecidas pela aplicação atual, e esvazia public/images/qr e artifacts.
 * Não remove Authentication, Storage, índices, regras de segurança ou outras
 * configurações do Firebase.
 *
 * Simular, sem fazer exclusões:
 *   npm run db:prepare-launch
 *
 * Ao final da simulação, o terminal exibirá o comando completo para esvaziar o
 * banco. Confira projeto e evento e então copie e execute a linha inteira, que
 * incluirá --apply e uma confirmação exclusiva dessa operação.
 */
import {
  applyDatabaseCleanup,
  assertDestructiveConfirmation,
  createDatabaseCleanupPlan,
  initializeFirestore,
  loadLocalEnvironment,
  parseArguments,
  requireEnvironment,
} from "./lib/firestore-admin.mjs"

await loadLocalEnvironment()
const args = parseArguments()
const eventId = requireEnvironment("EVENT_ID")
const { firestore, projectId } = initializeFirestore()
console.log("Mapeando documentos do Firestore...")
const cleanupPlan = await createDatabaseCleanupPlan(firestore, {
  onCollectionRead: ({ scope, current, total, name, documents }) =>
    console.log(
      `${scope === "root" ? "Coleção" : "Subcoleção de simulação"} ${current}/${total}: ${name} (${documents} documentos).`
    ),
})
const expected = `PREPARE_LAUNCH:${projectId}:${eventId}`

console.log(
  JSON.stringify(
    {
      mode: args.apply ? "APLICAÇÃO" : "SIMULAÇÃO (nenhuma gravação)",
      projectId,
      eventId,
      documentsToDelete: cleanupPlan.references.length,
      generatedFilesToDelete: Object.fromEntries(
        cleanupPlan.generatedDirectories.map((item) => [
          item.displayPath,
          item.files,
        ])
      ),
      warning:
        "Remove todos os dados do Firestore e os artefatos locais de QR. Não remove usuários do Firebase Authentication nem arquivos do Storage.",
    },
    null,
    2
  )
)

if (
  !assertDestructiveConfirmation({
    args,
    expected,
    action: "Preparação para lançamento",
  })
) {
  console.log(
    `\nPara aplicar: npm run db:prepare-launch -- --apply --confirm "${expected}"`
  )
  process.exit(0)
}

await applyDatabaseCleanup(firestore, cleanupPlan, {
  onDeleteBatch: ({ deleted, total }) =>
    console.log(`Firestore: ${deleted}/${total} documentos removidos.`),
  onDirectoryCleared: ({ displayPath }) =>
    console.log(`Diretório esvaziado: ${displayPath}.`),
})
console.log("Firestore limpo e pronto para receber os dados reais do evento.")
