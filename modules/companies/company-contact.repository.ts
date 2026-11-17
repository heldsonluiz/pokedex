import "server-only"

import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { firestore } from "@/lib/firebase/admin"
import { getFirestoreCollectionName } from "@/lib/firebase/firestore-collection"

export async function setCompanyContactConsent(
  eventId: string,
  participantId: string,
  companyId: string,
  granted: boolean
) {
  const profileRef = firestore
    .collection(getFirestoreCollectionName("profiles"))
    .doc(participantId)
  const companyRef = firestore
    .collection(getFirestoreCollectionName("companies"))
    .doc(companyId)
  await firestore.runTransaction(async (transaction) => {
    const [profile, company] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(companyRef),
    ])
    if (
      !profile.exists ||
      profile.get("eventId") !== eventId ||
      !company.exists ||
      company.get("eventId") !== eventId
    )
      throw new Error("Invalid contact consent target")
    const now = Timestamp.now()
    transaction.update(profileRef, {
      contactCompanyIds: granted
        ? FieldValue.arrayUnion(companyId)
        : FieldValue.arrayRemove(companyId),
      contactConsentUpdatedAt: now,
    })
  })
}
