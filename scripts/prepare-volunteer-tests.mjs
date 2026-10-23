/** Dedicated test-only reset. Dry-run by default; never touches production roots. */
import { createHash } from "node:crypto"
import { access, mkdir, writeFile } from "node:fs/promises"

import { Timestamp } from "firebase-admin/firestore"

import { createVolunteerFixture } from "./fixtures/volunteer-test-data.mjs"
import {
  initializeFirestore,
  isDevMode,
  loadLocalEnvironment,
  parseArguments,
  requireEnvironment,
  writeDocuments,
} from "./lib/firestore-admin.mjs"

const args = parseArguments()
for (const key of Object.keys(args)) {
  if (!["apply", "target", "confirm"].includes(key))
    throw new Error(`Argumento desconhecido: ${key}`)
}
await loadLocalEnvironment(".env.local", { override: true })
if (!isDevMode())
  throw new Error("Operação permitida somente com DEVMODE=true em .env.local.")
const appOrigin = new URL(
  args.target ?? requireEnvironment("NEXT_PUBLIC_APP_URL")
)
if (
  appOrigin.protocol !== "https:" ||
  appOrigin.pathname !== "/" ||
  appOrigin.search ||
  appOrigin.hash ||
  appOrigin.username ||
  appOrigin.password
)
  throw new Error(
    "Informe --target com a origem HTTPS pública dos voluntários, sem caminho ou credenciais."
  )
const eventId = requireEnvironment("EVENT_ID")
const documents = createVolunteerFixture({
  eventId,
  appOrigin,
  now: Timestamp.now(),
})
for (const item of documents) {
  if (item.data.imageUrl?.startsWith(appOrigin.origin + "/")) {
    await access(`public${new URL(item.data.imageUrl).pathname}`)
  }
}
const { firestore, projectId } = initializeFirestore()
const collections = (await firestore.listCollections()).filter((ref) =>
  ref.id.startsWith("test_")
)
const counts = {}
for (const ref of collections)
  counts[ref.id] = (await ref.count().get()).data().count
const confirmation = `RESET_VOLUNTEERS:${projectId}:${eventId}`
console.log(
  JSON.stringify(
    {
      mode: args.apply ? "APLICAÇÃO" : "SIMULAÇÃO",
      projectId,
      eventId,
      appOrigin: appOrigin.origin,
      scope:
        "Todas as coleções raiz test_ e seus descendentes, em todos os eventos de testes",
      existingRootDocuments: counts,
      seed: documents.reduce((out, item) => {
        out[item.collection] = (out[item.collection] ?? 0) + 1
        return out
      }, {}),
      participants: 0,
      confirmation,
    },
    null,
    2
  )
)
if (!args.apply) process.exit(0)
if (args.confirm !== confirmation)
  throw new Error("Confirmação não corresponde à simulação.")
// Preserve a typed, private snapshot before the first deletion. Do not run during volunteer activity.
function encode(value) {
  if (value === null || typeof value !== "object") return value
  if (value instanceof Timestamp)
    return {
      __firestoreType: "Timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    }
  if (value instanceof Date)
    return { __firestoreType: "Date", iso: value.toISOString() }
  if (Buffer.isBuffer(value))
    return { __firestoreType: "Bytes", base64: value.toString("base64") }
  if (value.constructor?.name === "GeoPoint")
    return {
      __firestoreType: "GeoPoint",
      latitude: value.latitude,
      longitude: value.longitude,
    }
  if (value.constructor?.name === "DocumentReference")
    return { __firestoreType: "Reference", path: value.path }
  if (Array.isArray(value)) return value.map(encode)
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, encode(item)])
  )
}
const snapshot = []
async function collect(collection) {
  for (const ref of await collection.listDocuments()) {
    const doc = await ref.get()
    if (doc.exists) snapshot.push({ path: ref.path, data: encode(doc.data()) })
    for (const child of await ref.listCollections()) await collect(child)
  }
}
for (const ref of collections) await collect(ref)
const directory = `/tmp/pokedex-volunteer-backup-${Date.now()}`
await mkdir(directory, { mode: 0o700 })
const payload = JSON.stringify({
  format: "typed-firestore-snapshot-v1",
  projectId,
  eventId,
  exportedAt: new Date().toISOString(),
  documents: snapshot,
})
await writeFile(`${directory}/snapshot.json`, payload, { mode: 0o600 })
console.log(
  JSON.stringify({
    backup: `${directory}/snapshot.json`,
    documents: snapshot.length,
    sha256: createHash("sha256").update(payload).digest("hex"),
  })
)
// recursiveDelete includes descendant documents and missing parent documents.
for (const ref of collections) {
  if (!ref.id.startsWith("test_")) throw new Error("Coleção fora do escopo.")
  await firestore.recursiveDelete(ref)
}
await writeDocuments(firestore, documents)
const verification = {}
for (const name of new Set(documents.map((item) => item.collection))) {
  verification[name] = (
    await firestore
      .collection(`test_${name}`)
      .where("eventId", "==", eventId)
      .get()
  ).size
  if (
    verification[name] !==
    documents.filter((item) => item.collection === name).length
  )
    throw new Error(`Contagem divergente: ${name}`)
}
if (
  (await firestore.collection("test_profiles").count().get()).data().count !== 0
)
  throw new Error(
    "Há participantes após o reset: verifique acessos concorrentes."
  )
console.log(
  JSON.stringify(
    {
      status: "concluído",
      verification,
      participants: 0,
      backup: `${directory}/snapshot.json`,
    },
    null,
    2
  )
)
