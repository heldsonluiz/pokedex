import "server-only"

const TEST_COLLECTION_PREFIX = "test_"

export function getFirestoreCollectionName(collectionName: string) {
  return process.env.DEVMODE?.trim().toLowerCase() === "true"
    ? `${TEST_COLLECTION_PREFIX}${collectionName}`
    : collectionName
}
