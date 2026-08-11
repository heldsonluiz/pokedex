import { mkdir, readdir, readFile, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)
const GENERATED_DATA_DIRECTORIES = [
  path.join(PROJECT_ROOT, "public/images/qr"),
  path.join(PROJECT_ROOT, "artifacts"),
]
const APPLICATION_SUBCOLLECTIONS = [
  "attempts",
  "entryChunks",
  "raffles",
  "skippedProfiles",
  "winners",
]

export const APPLICATION_COLLECTIONS = [
  "activityCompletions",
  "connections",
  "eventOperations",
  "participantSummaries",
  "profiles",
  "raffleAttempts",
  "raffleEntryChunks",
  "raffleLiveSignals",
  "raffleSkippedProfiles",
  "raffleTestRuns",
  "raffleWinners",
  "raffles",
  "rewardRedemptions",
  "rewards",
  "scheduleSlots",
  "speakers",
  "talk-ratings",
  "talks",
  "ticketTransactions",
  "companies",
  "missions",
  "tags",
]

export async function loadLocalEnvironment(
  filename = ".env.local",
  { override = false } = {}
) {
  let content

  try {
    content = await readFile(filename, "utf8")
  } catch (error) {
    if (error?.code === "ENOENT") return
    throw error
  }

  for (const line of content.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/u)
    if (!match || (!override && process.env[match[1]])) continue

    let value = match[2]
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[match[1]] = value
  }
}

export function isDevMode() {
  return process.env.DEVMODE?.trim().toLowerCase() === "true"
}

export function getFirestoreCollectionName(collectionName) {
  return isDevMode() ? `test_${collectionName}` : collectionName
}

export function requireEnvironment(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`)
  return value
}

export function parseArguments(
  argv = process.argv.slice(2),
  { booleanArguments = ["apply"] } = {}
) {
  const result = { apply: false }
  const booleanArgumentSet = new Set(booleanArguments)

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const argumentName = argument.slice(2)
    if (booleanArgumentSet.has(argumentName)) {
      result[argumentName] = true
      continue
    }
    if (!argument.startsWith("--")) {
      throw new Error(`Argumento inesperado: ${argument}`)
    }

    const [inlineKey, inlineValue] = argument.slice(2).split("=", 2)
    const value = inlineValue ?? argv[index + 1]
    if (!value || value.startsWith("--")) {
      throw new Error(`Informe um valor para --${inlineKey}`)
    }
    result[inlineKey] = value
    if (inlineValue === undefined) index += 1
  }

  return result
}

export function initializeFirestore() {
  const projectId = requireEnvironment("FB_ADMIN_PROJECT_ID")
  const firebaseApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: requireEnvironment("FB_ADMIN_CLIENT_EMAIL"),
        privateKey: requireEnvironment("FB_ADMIN_PRIVATE_KEY").replace(
          /\\n/gu,
          "\n"
        ),
      }),
    })

  return { firestore: getFirestore(firebaseApp), projectId }
}

export function assertDestructiveConfirmation({ args, expected, action }) {
  if (!args.apply) return false
  if (args.confirm !== expected) {
    throw new Error(
      `${action} não autorizado. Repita com --apply --confirm "${expected}".`
    )
  }
  return true
}

export async function deleteReferences(
  firestore,
  references,
  { onBatchCommitted } = {}
) {
  for (let offset = 0; offset < references.length; offset += 400) {
    const batch = firestore.batch()
    for (const reference of references.slice(offset, offset + 400))
      batch.delete(reference)
    await batch.commit()
    onBatchCommitted?.({
      deleted: Math.min(offset + 400, references.length),
      total: references.length,
    })
  }
}

async function collectDescendantReferences(reference, output) {
  for (const collection of await reference.listCollections()) {
    const snapshot = await collection.get()
    for (const document of snapshot.docs) {
      await collectDescendantReferences(document.ref, output)
      output.push(document.ref)
    }
  }
}

export async function deleteDocumentTrees(
  firestore,
  references,
  { onTreeCollected, onBatchCommitted } = {}
) {
  const documents = []
  for (const [index, reference] of references.entries()) {
    const previousCount = documents.length
    await collectDescendantReferences(reference, documents)
    documents.push(reference)
    onTreeCollected?.({
      current: index + 1,
      total: references.length,
      path: reference.path,
      documents: documents.length - previousCount,
    })
  }
  await deleteReferences(firestore, documents, { onBatchCommitted })
}

export async function collectApplicationDocumentReferences(firestore) {
  const references = []
  for (const name of APPLICATION_COLLECTIONS) {
    const collection = firestore.collection(getFirestoreCollectionName(name))
    const snapshot = await collection.get()
    for (const document of snapshot.docs) {
      await collectDescendantReferences(document.ref, references)
      references.push(document.ref)
    }
  }
  return references
}

export async function collectAllDocumentReferences(
  firestore,
  { onCollectionRead } = {}
) {
  const references = new Map()
  const rootCollections = (await firestore.listCollections()).filter(
    (collection) => !isDevMode() || collection.id.startsWith("test_")
  )
  const nestedParents = []

  for (const [index, collection] of rootCollections.entries()) {
    const snapshot = await collection.get()
    for (const document of snapshot.docs) {
      references.set(document.ref.path, document.ref)
      if (collection.id === getFirestoreCollectionName("raffleTestRuns"))
        nestedParents.push(document.ref)
    }
    onCollectionRead?.({
      scope: "root",
      current: index + 1,
      total: rootCollections.length,
      name: collection.id,
      documents: snapshot.size,
    })
  }

  const nestedTotal = nestedParents.length * APPLICATION_SUBCOLLECTIONS.length
  let nestedCurrent = 0
  for (const parent of nestedParents) {
    for (const name of APPLICATION_SUBCOLLECTIONS) {
      const snapshot = await parent.collection(name).get()
      for (const document of snapshot.docs)
        references.set(document.ref.path, document.ref)
      nestedCurrent += 1
      onCollectionRead?.({
        scope: "simulation",
        current: nestedCurrent,
        total: nestedTotal,
        name: `${parent.path}/${name}`,
        documents: snapshot.size,
      })
    }
  }

  return [...references.values()].sort(
    (first, second) =>
      second.path.split("/").length - first.path.split("/").length
  )
}

async function countDirectoryFiles(directory) {
  let entries

  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error?.code === "ENOENT") return 0
    throw error
  }

  let total = 0
  for (const entry of entries) {
    if (entry.isDirectory())
      total += await countDirectoryFiles(path.join(directory, entry.name))
    else total += 1
  }
  return total
}

export async function createDatabaseCleanupPlan(
  firestore,
  { onCollectionRead } = {}
) {
  const references = await collectAllDocumentReferences(firestore, {
    onCollectionRead,
  })
  const generatedDirectories = await Promise.all(
    GENERATED_DATA_DIRECTORIES.map(async (directory) => ({
      directory,
      displayPath: path.relative(PROJECT_ROOT, directory),
      files: await countDirectoryFiles(directory),
    }))
  )

  return { references, generatedDirectories }
}

export async function applyDatabaseCleanup(
  firestore,
  plan,
  { onDeleteBatch, onDirectoryCleared } = {}
) {
  await deleteReferences(firestore, plan.references, {
    onBatchCommitted: onDeleteBatch,
  })

  for (const { directory, displayPath } of plan.generatedDirectories) {
    await mkdir(directory, { recursive: true })
    const entries = await readdir(directory)
    for (const entry of entries) {
      await rm(path.join(directory, entry), { recursive: true, force: true })
    }
    onDirectoryCleared?.({ displayPath })
  }
}

export function deterministicId(parts) {
  return import("node:crypto").then(({ createHash }) =>
    createHash("sha256").update(JSON.stringify(parts)).digest("hex")
  )
}

export async function writeDocuments(
  firestore,
  documents,
  { onBatchCommitted } = {}
) {
  for (let offset = 0; offset < documents.length; offset += 400) {
    const batch = firestore.batch()
    for (const { collection, id, data } of documents.slice(
      offset,
      offset + 400
    )) {
      batch.set(
        firestore.collection(getFirestoreCollectionName(collection)).doc(id),
        data
      )
    }
    await batch.commit()
    onBatchCommitted?.({
      written: Math.min(offset + 400, documents.length),
      total: documents.length,
    })
  }
}
